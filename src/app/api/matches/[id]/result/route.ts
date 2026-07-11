import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: {
          include: {
            scoringConfig: true
          }
        },
        sets: true
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: "Partida não encontrada" },
        { status: 404 }
      )
    }

    if (match.homePlayerId !== decoded.userId && match.awayPlayerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas os jogadores desta partida podem registrar o resultado" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { action } = body

    // ACTION: start_match — player starts the match with a start photo
    if (action === "start_match") {
      if (match.status !== "scheduled") {
        return NextResponse.json(
          { error: "Esta partida não pode ser iniciada" },
          { status: 400 }
        )
      }

      const { startPhotoUrl } = body
      if (!startPhotoUrl) {
        return NextResponse.json(
          { error: "Foto do início do jogo é obrigatória" },
          { status: 400 }
        )
      }

      const updatedMatch = await prisma.match.update({
        where: { id },
        data: {
          status: "in_progress",
          startPhotoUrl,
          startedAt: new Date()
        }
      })

      // Notify the other player
      const otherPlayerId = match.homePlayerId === decoded.userId 
        ? match.awayPlayerId 
        : match.homePlayerId

      await prisma.notification.create({
        data: {
          userId: otherPlayerId,
          title: "Jogo iniciado",
          message: "O jogo foi iniciado. Aguardando resultado.",
          type: "match",
          link: `/tournaments/${match.tournamentId}`
        }
      })

      return NextResponse.json({ match: updatedMatch })
    }

    // ACTION: submit_result — player submits the final score
    if (action === "submit_result") {
      if (match.status !== "in_progress") {
        return NextResponse.json(
          { error: "Esta partida não pode ter resultado registrado" },
          { status: 400 }
        )
      }

      const { sets, endPhotoUrl } = body

      if (!sets || !Array.isArray(sets) || sets.length === 0) {
        return NextResponse.json(
          { error: "Placar é obrigatório" },
          { status: 400 }
        )
      }

      if (!endPhotoUrl) {
        return NextResponse.json(
          { error: "Foto do final do jogo é obrigatória" },
          { status: 400 }
        )
      }

      // Validate sets according to tournament rules
      const { setsPerMatch } = match.tournament

      let homeSetsWon = 0
      let awaySetsWon = 0
      let homeGamesTotal = 0
      let awayGamesTotal = 0

      for (const set of sets) {
        const { homeGames, awayGames } = set

        if (homeGames > awayGames) {
          homeSetsWon++
        } else if (awayGames > homeGames) {
          awaySetsWon++
        }

        homeGamesTotal += homeGames
        awayGamesTotal += awayGames
      }

      const requiredSets = Math.ceil(setsPerMatch / 2)
      if (homeSetsWon < requiredSets && awaySetsWon < requiredSets) {
        return NextResponse.json(
          { error: `Nenhum jogador atingiu ${requiredSets} sets necessários para vencer` },
          { status: 400 }
        )
      }

      if (sets.length > setsPerMatch) {
        return NextResponse.json(
          { error: `Máximo de ${setsPerMatch} sets por partida` },
          { status: 400 }
        )
      }

      const winnerId = homeSetsWon > awaySetsWon ? match.homePlayerId : match.awayPlayerId

      // Delete existing sets and save new ones
      await prisma.$transaction([
        prisma.set.deleteMany({ where: { matchId: id } }),
        ...sets.map((set: { homeGames: number; awayGames: number; isTiebreak?: boolean; isSuperTiebreak?: boolean }, index: number) => 
          prisma.set.create({
            data: {
              matchId: id,
              setNumber: index + 1,
              homeGames: set.homeGames,
              awayGames: set.awayGames,
              isTiebreak: set.isTiebreak || false,
              isSuperTiebreak: set.isSuperTiebreak || false
            }
          })
        )
      ])

      // Update match with result
      const updatedMatch = await prisma.match.update({
        where: { id },
        data: {
          status: "finished",
          homeScore: homeSetsWon,
          awayScore: awaySetsWon,
          winnerId,
          endPhotoUrl,
          finishedAt: new Date()
        },
        include: {
          sets: { orderBy: { setNumber: "asc" } }
        }
      })

      // Update ranking
      await updateRanking(match.tournamentId, match.id)

      // Notify the other player
      const otherPlayerId = match.homePlayerId === decoded.userId 
        ? match.awayPlayerId 
        : match.homePlayerId

      await prisma.notification.create({
        data: {
          userId: otherPlayerId,
          title: "Resultado registrado",
          message: `Resultado: ${homeSetsWon} x ${awaySetsWon}`,
          type: "result",
          link: `/tournaments/${match.tournamentId}`
        }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          tournamentId: match.tournamentId,
          userId: decoded.userId,
          action: "result_submitted",
          entityType: "match",
          entityId: id,
          newValue: { homeScore: homeSetsWon, awayScore: awaySetsWon, winnerId, sets }
        }
      })

      return NextResponse.json({ match: updatedMatch })
    }

    return NextResponse.json(
      { error: "Ação inválida" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Erro ao registrar resultado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PATCH: owner edits an existing result
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const match = await prisma.match.findUnique({
      where: { id },
      include: { tournament: true, sets: true }
    })
    if (!match) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
    }

    // Only owner can edit
    if (match.tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas o organizador pode editar resultados" },
        { status: 403 }
      )
    }

    if (match.status !== "finished") {
      return NextResponse.json(
        { error: "Apenas jogos finalizados podem ser editados" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { sets, endPhotoUrl } = body

    if (!sets || !Array.isArray(sets) || sets.length === 0) {
      return NextResponse.json({ error: "Placar é obrigatório" }, { status: 400 })
    }

    const { setsPerMatch } = match.tournament
    let homeSetsWon = 0
    let awaySetsWon = 0

    for (const set of sets) {
      const { homeGames, awayGames } = set
      if (homeGames > awayGames) homeSetsWon++
      else if (awayGames > homeGames) awaySetsWon++
    }

    const requiredSets = Math.ceil(setsPerMatch / 2)
    if (homeSetsWon < requiredSets && awaySetsWon < requiredSets) {
      return NextResponse.json(
        { error: `Nenhum jogador atingiu ${requiredSets} sets necessários` },
        { status: 400 }
      )
    }

    const winnerId = homeSetsWon > awaySetsWon ? match.homePlayerId : match.awayPlayerId

    await prisma.$transaction([
      prisma.set.deleteMany({ where: { matchId: id } }),
      ...sets.map((set: { homeGames: number; awayGames: number; isTiebreak?: boolean; isSuperTiebreak?: boolean }, index: number) => 
        prisma.set.create({
          data: {
            matchId: id,
            setNumber: index + 1,
            homeGames: set.homeGames,
            awayGames: set.awayGames,
            isTiebreak: set.isTiebreak || false,
            isSuperTiebreak: set.isSuperTiebreak || false
          }
        })
      )
    ])

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: {
        homeScore: homeSetsWon,
        awayScore: awaySetsWon,
        winnerId,
        endPhotoUrl: endPhotoUrl || match.endPhotoUrl
      },
      include: { sets: { orderBy: { setNumber: "asc" } } }
    })

    // Re-update ranking
    await updateRanking(match.tournamentId, match.id)

    await prisma.auditLog.create({
      data: {
        tournamentId: match.tournamentId,
        userId: decoded.userId,
        action: "result_edited",
        entityType: "match",
        entityId: id,
        newValue: { homeScore: homeSetsWon, awayScore: awaySetsWon, winnerId, sets }
      }
    })

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error("Erro ao editar resultado:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

async function updateRanking(tournamentId: string, matchId: string) {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      sets: true,
      tournament: { include: { scoringConfig: true } }
    }
  })

  if (!match || !match.winnerId || !match.tournament.scoringConfig) return

  const { scoringConfig } = match.tournament
  const isHomeWinner = match.winnerId === match.homePlayerId
  const homeSetsWon = match.sets.filter(s => s.homeGames > s.awayGames).length
  const awaySetsWon = match.sets.filter(s => s.awayGames > s.homeGames).length

  let homePoints = 0
  let awayPoints = 0

  if (isHomeWinner) {
    homePoints = awaySetsWon === 0 ? scoringConfig.winWithoutLosingSet : scoringConfig.winLosingOneSet
    awayPoints = homeSetsWon > 0 ? scoringConfig.lossWinningOneSet : scoringConfig.lossWithoutWinningSet
  } else {
    awayPoints = homeSetsWon === 0 ? scoringConfig.winWithoutLosingSet : scoringConfig.winLosingOneSet
    homePoints = awaySetsWon > 0 ? scoringConfig.lossWinningOneSet : scoringConfig.lossWithoutWinningSet
  }

  for (const playerId of [match.homePlayerId, match.awayPlayerId]) {
    const isHome = playerId === match.homePlayerId
    const points = isHome ? homePoints : awayPoints
    const setsWon = isHome ? homeSetsWon : awaySetsWon
    const setsLost = isHome ? awaySetsWon : homeSetsWon
    const gamesWon = isHome
      ? match.sets.reduce((sum, s) => sum + s.homeGames, 0)
      : match.sets.reduce((sum, s) => sum + s.awayGames, 0)
    const gamesLost = isHome
      ? match.sets.reduce((sum, s) => sum + s.awayGames, 0)
      : match.sets.reduce((sum, s) => sum + s.homeGames, 0)
    const isWinner = playerId === match.winnerId

    await prisma.playerRanking.upsert({
      where: { tournamentId_userId: { tournamentId, userId: playerId } },
      update: {
        points: { increment: points },
        matchesPlayed: { increment: 1 },
        wins: isWinner ? { increment: 1 } : undefined,
        losses: !isWinner ? { increment: 1 } : undefined,
        setsWon: { increment: setsWon },
        setsLost: { increment: setsLost },
        gamesWon: { increment: gamesWon },
        gamesLost: { increment: gamesLost },
        setBalance: { increment: setsWon - setsLost },
        gamesBalance: { increment: gamesWon - gamesLost }
      },
      create: {
        tournamentId,
        userId: playerId,
        position: 0,
        points,
        matchesPlayed: 1,
        wins: isWinner ? 1 : 0,
        losses: isWinner ? 0 : 1,
        setsWon,
        setsLost,
        gamesWon,
        gamesLost,
        setBalance: setsWon - setsLost,
        gamesBalance: gamesWon - gamesLost
      }
    })
  }
}

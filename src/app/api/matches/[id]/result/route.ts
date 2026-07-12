import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { advanceKnockoutMatch } from "@/lib/knockout"
import { recalculateTournamentRanking } from "@/lib/ranking"

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

    // ACTION: forfeit — player forfeits during in_progress match
    if (action === "forfeit") {
      if (match.status !== "in_progress") {
        return NextResponse.json(
          { error: "Desistência só é possível durante a partida" },
          { status: 400 }
        )
      }

      const { forfeitById, currentSets } = body

      if (!forfeitById) {
        return NextResponse.json(
          { error: "Jogador que desiste é obrigatório" },
          { status: 400 }
        )
      }

      if (forfeitById !== match.homePlayerId && forfeitById !== match.awayPlayerId) {
        return NextResponse.json(
          { error: "Jogador inválido" },
          { status: 400 }
        )
      }

      const winnerId = forfeitById === match.homePlayerId ? match.awayPlayerId : match.homePlayerId
      const isHomeWinner = winnerId === match.homePlayerId

      // Build final sets: current sets + remaining as 0-6 for forfeiting player
      const { setsPerMatch } = match.tournament
      const finalSets: Array<{ homeGames: number; awayGames: number }> = []

      if (currentSets && Array.isArray(currentSets) && currentSets.length > 0) {
        // Use provided current sets
        for (const s of currentSets) {
          finalSets.push({ homeGames: s.homeGames || 0, awayGames: s.awayGames || 0 })
        }
      }

      // Fill remaining sets: forfeiting player gets 0, winner gets 6
      while (finalSets.length < setsPerMatch) {
        if (isHomeWinner) {
          finalSets.push({ homeGames: 6, awayGames: 0 })
        } else {
          finalSets.push({ homeGames: 0, awayGames: 6 })
        }
      }

      // Calculate scores
      let homeSetsWon = 0
      let awaySetsWon = 0
      for (const s of finalSets) {
        if (s.homeGames > s.awayGames) homeSetsWon++
        else if (s.awayGames > s.homeGames) awaySetsWon++
      }

      // Delete existing sets and create final ones
      await prisma.$transaction([
        prisma.set.deleteMany({ where: { matchId: id } }),
        ...finalSets.map((s, idx) =>
          prisma.set.create({
            data: {
              matchId: id,
              setNumber: idx + 1,
              homeGames: s.homeGames,
              awayGames: s.awayGames,
              isTiebreak: false,
              isSuperTiebreak: false
            }
          })
        )
      ])

      const updatedMatch = await prisma.match.update({
        where: { id },
        data: {
          status: "finished",
          homeScore: homeSetsWon,
          awayScore: awaySetsWon,
          winnerId,
          finishedAt: new Date(),
          endReason: "forfeit"
        },
        include: { sets: { orderBy: { setNumber: "asc" } } }
      })

      // Get scoring config for forfeit points
      const scoringConfig = await prisma.scoringConfig.findUnique({
        where: { tournamentId: match.tournamentId }
      })

      // Apply forfeit scoring
      const winPoints = scoringConfig?.winByForfeit ?? 3
      const lossPoints = scoringConfig?.lossByForfeit ?? 0
      const penaltyPoints = scoringConfig?.withdrawalPenalty ?? 0

      await prisma.playerRanking.upsert({
        where: { tournamentId_userId: { tournamentId: match.tournamentId, userId: winnerId } },
        create: {
          tournamentId: match.tournamentId,
          userId: winnerId,
          position: 0,
          points: winPoints,
          matchesPlayed: 1,
          wins: 1,
          winsByWO: 0,
          setsWon: homeSetsWon,
          setsLost: awaySetsWon,
          gamesWon: finalSets.reduce((acc, s) => acc + (winnerId === match.homePlayerId ? s.homeGames : s.awayGames), 0),
          gamesLost: finalSets.reduce((acc, s) => acc + (winnerId === match.homePlayerId ? s.awayGames : s.homeGames), 0),
          setBalance: homeSetsWon - awaySetsWon,
          gamesBalance: finalSets.reduce((acc, s) => acc + (winnerId === match.homePlayerId ? s.homeGames : s.awayGames), 0) - finalSets.reduce((acc, s) => acc + (winnerId === match.homePlayerId ? s.awayGames : s.homeGames), 0)
        },
        update: {
          points: { increment: winPoints },
          matchesPlayed: { increment: 1 },
          wins: { increment: 1 },
          setsWon: { increment: homeSetsWon },
          setsLost: { increment: awaySetsWon },
          gamesWon: { increment: finalSets.reduce((acc, s) => acc + (winnerId === match.homePlayerId ? s.homeGames : s.awayGames), 0) },
          gamesLost: { increment: finalSets.reduce((acc, s) => acc + (winnerId === match.homePlayerId ? s.awayGames : s.homeGames), 0) }
        }
      })

      // Update ranking for loser
      const loserId = forfeitById
      await prisma.playerRanking.upsert({
        where: { tournamentId_userId: { tournamentId: match.tournamentId, userId: loserId } },
        create: {
          tournamentId: match.tournamentId,
          userId: loserId,
          position: 0,
          points: lossPoints + penaltyPoints,
          matchesPlayed: 1,
          losses: 1,
          lossesByWO: 0,
          setsWon: awaySetsWon,
          setsLost: homeSetsWon,
          gamesWon: finalSets.reduce((acc, s) => acc + (loserId === match.homePlayerId ? s.homeGames : s.awayGames), 0),
          gamesLost: finalSets.reduce((acc, s) => acc + (loserId === match.homePlayerId ? s.awayGames : s.homeGames), 0),
          setBalance: awaySetsWon - homeSetsWon,
          gamesBalance: finalSets.reduce((acc, s) => acc + (loserId === match.homePlayerId ? s.homeGames : s.awayGames), 0) - finalSets.reduce((acc, s) => acc + (loserId === match.homePlayerId ? s.awayGames : s.homeGames), 0)
        },
        update: {
          points: { increment: lossPoints + penaltyPoints },
          matchesPlayed: { increment: 1 },
          losses: { increment: 1 },
          setsWon: { increment: awaySetsWon },
          setsLost: { increment: homeSetsWon },
          gamesWon: { increment: finalSets.reduce((acc, s) => acc + (loserId === match.homePlayerId ? s.homeGames : s.awayGames), 0) },
          gamesLost: { increment: finalSets.reduce((acc, s) => acc + (loserId === match.homePlayerId ? s.awayGames : s.homeGames), 0) }
        }
      })

      // Create penalty record for withdrawal
      if (penaltyPoints !== 0) {
        await prisma.penalty.create({
          data: {
            tournamentId: match.tournamentId,
            userId: forfeitById,
            matchId: match.id,
            type: "withdrawal",
            points: penaltyPoints,
            reason: "Desistência durante a partida",
            appliedById: decoded.userId
          }
        })
      }

      // Notify the other player
      const otherPlayerId = match.homePlayerId === decoded.userId
        ? match.awayPlayerId
        : match.homePlayerId

      await prisma.notification.create({
        data: {
          userId: otherPlayerId,
          title: "Jogo encerrado por desistência",
          message: "O adversário desistiu da partida.",
          type: "result",
          link: `/tournaments/${match.tournamentId}`
        }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          tournamentId: match.tournamentId,
          userId: decoded.userId,
          action: "match_forfeited",
          entityType: "match",
          entityId: id,
          newValue: { winnerId, forfeitById, finalSets, endReason: "forfeit" }
        }
      })

      if (match.phase === "knockout") {
        await advanceKnockoutMatch(match.id, winnerId)
      } else {
        await recalculateTournamentRanking(match.tournamentId)
      }

      return NextResponse.json({ match: updatedMatch })
    }

    // ACTION: wo_victory — walkover victory
    if (action === "wo_victory") {
      if (match.status !== "scheduled" && match.status !== "in_progress") {
        return NextResponse.json(
          { error: "Esta partida não pode ter walkover registrado" },
          { status: 400 }
        )
      }

      const { winnerId, woReason } = body

      if (!winnerId) {
        return NextResponse.json(
          { error: "Vencedor é obrigatório" },
          { status: 400 }
        )
      }

      if (winnerId !== match.homePlayerId && winnerId !== match.awayPlayerId) {
        return NextResponse.json(
          { error: "Vencedor inválido" },
          { status: 400 }
        )
      }

      if (!woReason || woReason.trim().length === 0) {
        return NextResponse.json(
          { error: "Motivo do W.O. é obrigatório" },
          { status: 400 }
        )
      }

      if (woReason.length > 200) {
        return NextResponse.json(
          { error: "Motivo deve ter no máximo 200 caracteres" },
          { status: 400 }
        )
      }

      const looserId = winnerId === match.homePlayerId ? match.awayPlayerId : match.homePlayerId

      const updatedMatch = await prisma.match.update({
        where: { id },
        data: {
          status: "wo",
          winnerId,
          woGivenById: looserId,
          woReceivedById: winnerId,
          woReason: woReason.trim(),
          finishedAt: new Date(),
          endReason: "wo"
        }
      })

      // Update ranking with W.O. points and configured sets/games
      const { scoringConfig } = match.tournament
      if (scoringConfig) {
        const woWinSets = scoringConfig.woWinSets ?? 2
        const woLossSets = scoringConfig.woLossSets ?? 0
        const woWinGames = scoringConfig.woWinGames ?? 12
        const woLossGames = scoringConfig.woLossGames ?? 0

        for (const playerId of [match.homePlayerId, match.awayPlayerId]) {
          const isWinner = playerId === winnerId
          const points = isWinner ? scoringConfig.winByWO : scoringConfig.lossByWO
          const setsWon = isWinner ? woWinSets : woLossSets
          const setsLost = isWinner ? woLossSets : woWinSets
          const gamesWon = isWinner ? woWinGames : woLossGames
          const gamesLost = isWinner ? woLossGames : woWinGames

          await prisma.playerRanking.upsert({
            where: { tournamentId_userId: { tournamentId: match.tournamentId, userId: playerId } },
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
              tournamentId: match.tournamentId,
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

      // Notify the other player
      const otherPlayerId = match.homePlayerId === decoded.userId
        ? match.awayPlayerId
        : match.homePlayerId

      await prisma.notification.create({
        data: {
          userId: otherPlayerId,
          title: "Walkover registrado",
          message: `W.O. registrado. Motivo: ${woReason.trim()}`,
          type: "result",
          link: `/tournaments/${match.tournamentId}`
        }
      })

      // Audit log
      await prisma.auditLog.create({
        data: {
          tournamentId: match.tournamentId,
          userId: decoded.userId,
          action: "wo_registered",
          entityType: "match",
          entityId: id,
          newValue: { winnerId, woReason: woReason.trim() }
        }
      })

      if (match.phase === "knockout") {
        await advanceKnockoutMatch(match.id, winnerId)
      } else {
        await recalculateTournamentRanking(match.tournamentId)
      }

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

      for (const set of sets) {
        const { homeGames, awayGames } = set

        if (homeGames > awayGames) {
          homeSetsWon++
        } else if (awayGames > homeGames) {
          awaySetsWon++
        }
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
          finishedAt: new Date(),
          endReason: "normal"
        },
        include: {
          sets: { orderBy: { setNumber: "asc" } }
        }
      })

      if (match.phase === "knockout") {
        await advanceKnockoutMatch(match.id, winnerId)
      } else {
        await recalculateTournamentRanking(match.tournamentId)
      }

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

    if (match.phase === "knockout") {
      await advanceKnockoutMatch(match.id, winnerId)
    } else {
      await recalculateTournamentRanking(match.tournamentId)
    }

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

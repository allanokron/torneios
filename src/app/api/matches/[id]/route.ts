import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function DELETE(
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
      include: {
        tournament: {
          include: { scoringConfig: true }
        },
        sets: true
      }
    })

    if (!match) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
    }

    // Only tournament owner can delete
    if (match.tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas o organizador pode apagar partidas" },
        { status: 403 }
      )
    }

    const wasFinished = match.status === "finished" || match.status === "wo"

    // If match was finished/WO, recalculate rankings (subtract points)
    if (wasFinished && match.winnerId && match.tournament.scoringConfig) {
      const { scoringConfig } = match.tournament

      for (const playerId of [match.homePlayerId, match.awayPlayerId]) {
        const isWinner = playerId === match.winnerId
        const isHome = playerId === match.homePlayerId

        let pointsToSubtract = 0
        let winsToSubtract = 0
        let lossesToSubtract = 0
        let setsWonToSubtract = 0
        let setsLostToSubtract = 0
        let gamesWonToSubtract = 0
        let gamesLostToSubtract = 0

        if (match.status === "wo") {
          pointsToSubtract = isWinner ? scoringConfig.winByWO : scoringConfig.lossByWO
        } else {
          const homeSetsWon = match.sets.filter(s => s.homeGames > s.awayGames).length
          const awaySetsWon = match.sets.filter(s => s.awayGames > s.homeGames).length
          const setsWon = isHome ? homeSetsWon : awaySetsWon
          const setsLost = isHome ? awaySetsWon : homeSetsWon
          const gamesWon = isHome
            ? match.sets.reduce((sum, s) => sum + s.homeGames, 0)
            : match.sets.reduce((sum, s) => sum + s.awayGames, 0)
          const gamesLost = isHome
            ? match.sets.reduce((sum, s) => sum + s.awayGames, 0)
            : match.sets.reduce((sum, s) => sum + s.homeGames, 0)

          setsWonToSubtract = setsWon
          setsLostToSubtract = setsLost
          gamesWonToSubtract = gamesWon
          gamesLostToSubtract = gamesLost

          if (isWinner) {
            pointsToSubtract = awaySetsWon === 0 ? scoringConfig.winWithoutLosingSet : scoringConfig.winLosingOneSet
          } else {
            pointsToSubtract = homeSetsWon > 0 ? scoringConfig.lossWinningOneSet : scoringConfig.lossWithoutWinningSet
          }
        }

        winsToSubtract = isWinner ? 1 : 0
        lossesToSubtract = isWinner ? 0 : 1

        await prisma.playerRanking.updateMany({
          where: {
            tournamentId: match.tournamentId,
            userId: playerId
          },
          data: {
            points: { decrement: pointsToSubtract },
            matchesPlayed: { decrement: 1 },
            wins: { decrement: winsToSubtract },
            losses: { decrement: lossesToSubtract },
            setsWon: { decrement: setsWonToSubtract },
            setsLost: { decrement: setsLostToSubtract },
            gamesWon: { decrement: gamesWonToSubtract },
            gamesLost: { decrement: gamesLostToSubtract },
            setBalance: { decrement: setsWonToSubtract - setsLostToSubtract },
            gamesBalance: { decrement: gamesWonToSubtract - gamesLostToSubtract }
          }
        })
      }
    }

    // Delete related records
    await prisma.$transaction([
      prisma.set.deleteMany({ where: { matchId: id } }),
      prisma.scheduleProposal.deleteMany({ where: { matchId: id } }),
      prisma.rescheduleRequest.deleteMany({ where: { matchId: id } }),
      prisma.reservation.deleteMany({ where: { matchId: id } }),
      prisma.matchPhoto.deleteMany({ where: { matchId: id } }),
      prisma.message.deleteMany({ where: { matchId: id } }),
      prisma.penalty.deleteMany({ where: { matchId: id } }),
      prisma.contestation.deleteMany({ where: { matchId: id } }),
      prisma.match.delete({ where: { id } })
    ])

    // Audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: match.tournamentId,
        userId: decoded.userId,
        action: "match_deleted",
        entityType: "match",
        entityId: id,
        oldValue: {
          homePlayerId: match.homePlayerId,
          awayPlayerId: match.awayPlayerId,
          status: match.status,
          winnerId: match.winnerId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao apagar partida:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

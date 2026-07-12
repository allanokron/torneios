import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Get all accepted members
    const members = await prisma.tournamentMember.findMany({
      where: { tournamentId: id, status: "accepted" },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, city: true, state: true }
        }
      }
    })

    // Get existing rankings (preserves basePoints)
    const existingRankings = await prisma.playerRanking.findMany({
      where: { tournamentId: id }
    })
    const existingMap = new Map(existingRankings.map(r => [r.userId, r]))

    // Get all finished matches with sets
    const finishedMatches = await prisma.match.findMany({
      where: { tournamentId: id, status: { in: ["finished", "wo"] } },
      include: { sets: true }
    })

    // Get tournament scoring config
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: { scoringConfig: true }
    })

    const scoring = tournament?.scoringConfig || {
      winWithoutLosingSet: 3,
      winLosingOneSet: 2,
      lossWinningOneSet: 1,
      lossWithoutWinningSet: 0,
      winByWO: 3,
      lossByWO: 0,
      woWinSets: 2,
      woLossSets: 0,
      woWinGames: 12,
      woLossGames: 0,
      winByForfeit: 3,
      lossByForfeit: 0,
    }

    // Get all penalties for this tournament
    const penalties = await prisma.penalty.findMany({
      where: { tournamentId: id }
    })

    // Build match results from scratch
    const matchStats: Record<string, {
      matchesPlayed: number
      wins: number
      losses: number
      winsByWO: number
      lossesByWO: number
      setsWon: number
      setsLost: number
      gamesWon: number
      gamesLost: number
      matchPoints: number
    }> = {}

    // Initialize all members
    for (const m of members) {
      matchStats[m.userId] = {
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winsByWO: 0,
        lossesByWO: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        matchPoints: 0,
      }
    }

    // Process each finished match
    for (const match of finishedMatches) {
      const homeId = match.homePlayerId
      const awayId = match.awayPlayerId

      if (!matchStats[homeId]) matchStats[homeId] = { matchesPlayed: 0, wins: 0, losses: 0, winsByWO: 0, lossesByWO: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, matchPoints: 0 }
      if (!matchStats[awayId]) matchStats[awayId] = { matchesPlayed: 0, wins: 0, losses: 0, winsByWO: 0, lossesByWO: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, matchPoints: 0 }

      const home = matchStats[homeId]
      const away = matchStats[awayId]

      home.matchesPlayed++
      away.matchesPlayed++

      if (match.status === "wo") {
        const woWinner = match.winnerId === homeId ? home : away
        const woLoser = match.winnerId === homeId ? away : home
        woWinner.wins++
        woWinner.winsByWO++
        woWinner.matchPoints += scoring.winByWO
        woLoser.losses++
        woLoser.lossesByWO++
        woLoser.matchPoints += scoring.lossByWO

        // Use configured W.O. sets and games
        const woWinnerSets = scoring.woWinSets ?? 2
        const woLoserSets = scoring.woLossSets ?? 0
        const woWinnerGames = scoring.woWinGames ?? 12
        const woLoserGames = scoring.woLossGames ?? 0

        if (match.winnerId === homeId) {
          home.setsWon += woWinnerSets
          home.setsLost += woLoserSets
          away.setsWon += woLoserSets
          away.setsLost += woWinnerSets
          home.gamesWon += woWinnerGames
          home.gamesLost += woLoserGames
          away.gamesWon += woLoserGames
          away.gamesLost += woWinnerGames
        } else {
          away.setsWon += woWinnerSets
          away.setsLost += woLoserSets
          home.setsWon += woLoserSets
          home.setsLost += woWinnerSets
          away.gamesWon += woWinnerGames
          away.gamesLost += woLoserGames
          home.gamesWon += woLoserGames
          home.gamesLost += woWinnerGames
        }
        continue
      }

      // Handle forfeit matches
      if (match.endReason === "forfeit") {
        const forfeitWinner = match.winnerId === homeId ? home : away
        const forfeitLoser = match.winnerId === homeId ? away : home
        forfeitWinner.wins++
        forfeitWinner.matchPoints += scoring.winByForfeit
        forfeitLoser.losses++
        forfeitLoser.matchPoints += scoring.lossByForfeit

        // Track sets and games from the match
        const homeSetsWon = match.sets.filter(s => s.homeGames > s.awayGames).length
        const awaySetsWon = match.sets.filter(s => s.awayGames > s.homeGames).length
        const homeGamesTotal = match.sets.reduce((sum, s) => sum + s.homeGames, 0)
        const awayGamesTotal = match.sets.reduce((sum, s) => sum + s.awayGames, 0)

        home.setsWon += homeSetsWon
        home.setsLost += awaySetsWon
        away.setsWon += awaySetsWon
        away.setsLost += homeSetsWon
        home.gamesWon += homeGamesTotal
        home.gamesLost += awayGamesTotal
        away.gamesWon += awayGamesTotal
        away.gamesLost += homeGamesTotal
        continue
      }

      const homeSetsWon = match.sets.filter(s => s.homeGames > s.awayGames).length
      const awaySetsWon = match.sets.filter(s => s.awayGames > s.homeGames).length
      const homeGamesTotal = match.sets.reduce((sum, s) => sum + s.homeGames, 0)
      const awayGamesTotal = match.sets.reduce((sum, s) => sum + s.awayGames, 0)

      const homeIsWinner = homeSetsWon > awaySetsWon

      if (homeIsWinner) {
        home.wins++
        away.losses++
        home.matchPoints += awaySetsWon === 0 ? scoring.winWithoutLosingSet : scoring.winLosingOneSet
        away.matchPoints += homeSetsWon > 0 ? scoring.lossWinningOneSet : scoring.lossWithoutWinningSet
      } else {
        away.wins++
        home.losses++
        away.matchPoints += homeSetsWon === 0 ? scoring.winWithoutLosingSet : scoring.winLosingOneSet
        home.matchPoints += awaySetsWon > 0 ? scoring.lossWinningOneSet : scoring.lossWithoutWinningSet
      }

      home.setsWon += homeSetsWon
      home.setsLost += awaySetsWon
      away.setsWon += awaySetsWon
      away.setsLost += homeSetsWon

      home.gamesWon += homeGamesTotal
      home.gamesLost += awayGamesTotal
      away.gamesWon += awayGamesTotal
      away.gamesLost += homeGamesTotal
    }

    // Properly build ranking with basePoints from existing or default from seed
    const enrichedRanking = await Promise.all(
      members.map(async (m, _index) => {
        const stats = matchStats[m.userId] || { matchesPlayed: 0, wins: 0, losses: 0, winsByWO: 0, lossesByWO: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, matchPoints: 0 }
        const existing = existingMap.get(m.userId)

        // Preserve basePoints from existing record
        const basePoints = existing?.basePoints ?? 0

        // Calculate penalty points for this player
        const playerPenalties = penalties.filter(p => p.userId === m.userId)
        const penaltyPoints = playerPenalties.reduce((sum, p) => sum + p.points, 0)

        const totalPoints = basePoints + stats.matchPoints + penaltyPoints

        const setBalance = stats.setsWon - stats.setsLost
        const gamesBalance = stats.gamesWon - stats.gamesLost

        // Upsert into PlayerRanking table
        await prisma.playerRanking.upsert({
          where: { tournamentId_userId: { tournamentId: id, userId: m.userId } },
          update: {
            points: totalPoints,
            basePoints,
            matchesPlayed: stats.matchesPlayed,
            wins: stats.wins,
            losses: stats.losses,
            winsByWO: stats.winsByWO,
            lossesByWO: stats.lossesByWO,
            setsWon: stats.setsWon,
            setsLost: stats.setsLost,
            gamesWon: stats.gamesWon,
            gamesLost: stats.gamesLost,
            setBalance,
            gamesBalance,
          },
          create: {
            tournamentId: id,
            userId: m.userId,
            position: 0,
            points: totalPoints,
            basePoints,
            matchesPlayed: stats.matchesPlayed,
            wins: stats.wins,
            losses: stats.losses,
            winsByWO: stats.winsByWO,
            lossesByWO: stats.lossesByWO,
            setsWon: stats.setsWon,
            setsLost: stats.setsLost,
            gamesWon: stats.gamesWon,
            gamesLost: stats.gamesLost,
            setBalance,
            gamesBalance,
          }
        })

        return {
          userId: m.userId,
          user: m.user,
          position: 0,
          points: totalPoints,
          basePoints,
          matchesPlayed: stats.matchesPlayed,
          wins: stats.wins,
          losses: stats.losses,
          winsByWO: stats.winsByWO,
          lossesByWO: stats.lossesByWO,
          setsWon: stats.setsWon,
          setsLost: stats.setsLost,
          gamesWon: stats.gamesWon,
          gamesLost: stats.gamesLost,
          setBalance,
          gamesBalance,
        }
      })
    )

    // Sort by points
    enrichedRanking.sort((a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      b.setBalance - a.setBalance ||
      b.gamesBalance - a.gamesBalance
    )

    // Update positions
    const finalRanking = await Promise.all(
      enrichedRanking.map(async (r, index) => {
        await prisma.playerRanking.update({
          where: { tournamentId_userId: { tournamentId: id, userId: r.userId } },
          data: { position: index + 1 }
        })
        return { ...r, position: index + 1 }
      })
    )

    return NextResponse.json({ ranking: finalRanking })
  } catch (error) {
    console.error("Erro ao buscar ranking:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

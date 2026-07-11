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
    }

    // Build ranking from scratch
    const rankingMap: Record<string, {
      userId: string
      points: number
      matchesPlayed: number
      wins: number
      losses: number
      winsByWO: number
      lossesByWO: number
      setsWon: number
      setsLost: number
      gamesWon: number
      gamesLost: number
      setBalance: number
      gamesBalance: number
    }> = {}

    // Initialize all members
    for (const m of members) {
      rankingMap[m.userId] = {
        userId: m.userId,
        points: 0,
        matchesPlayed: 0,
        wins: 0,
        losses: 0,
        winsByWO: 0,
        lossesByWO: 0,
        setsWon: 0,
        setsLost: 0,
        gamesWon: 0,
        gamesLost: 0,
        setBalance: 0,
        gamesBalance: 0,
      }
    }

    // Process each finished match
    for (const match of finishedMatches) {
      const homeId = match.homePlayerId
      const awayId = match.awayPlayerId

      if (!rankingMap[homeId]) rankingMap[homeId] = { userId: homeId, points: 0, matchesPlayed: 0, wins: 0, losses: 0, winsByWO: 0, lossesByWO: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, setBalance: 0, gamesBalance: 0 }
      if (!rankingMap[awayId]) rankingMap[awayId] = { userId: awayId, points: 0, matchesPlayed: 0, wins: 0, losses: 0, winsByWO: 0, lossesByWO: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0, setBalance: 0, gamesBalance: 0 }

      const home = rankingMap[homeId]
      const away = rankingMap[awayId]

      home.matchesPlayed++
      away.matchesPlayed++

      if (match.status === "wo") {
        // W.O. - the winner gets WO points
        const woWinner = match.winnerId === homeId ? home : away
        const woLoser = match.winnerId === homeId ? away : home
        woWinner.wins++
        woWinner.winsByWO++
        woWinner.points += scoring.winByWO
        woLoser.losses++
        woLoser.lossesByWO++
        woLoser.points += scoring.lossByWO
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
        home.points += awaySetsWon === 0 ? scoring.winWithoutLosingSet : scoring.winLosingOneSet
        away.points += homeSetsWon > 0 ? scoring.lossWinningOneSet : scoring.lossWithoutWinningSet
      } else {
        away.wins++
        home.losses++
        away.points += homeSetsWon === 0 ? scoring.winWithoutLosingSet : scoring.winLosingOneSet
        home.points += awaySetsWon > 0 ? scoring.lossWinningOneSet : scoring.lossWithoutWinningSet
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

    // Calculate balances and sort
    const rankingArray = Object.values(rankingMap).map(r => ({
      ...r,
      setBalance: r.setsWon - r.setsLost,
      gamesBalance: r.gamesWon - r.gamesLost,
    }))

    rankingArray.sort((a, b) =>
      b.points - a.points ||
      b.wins - a.wins ||
      b.setBalance - a.setBalance ||
      b.gamesBalance - a.gamesBalance
    )

    // Upsert rankings into DB and build response
    const enrichedRanking = await Promise.all(
      rankingArray.map(async (r, index) => {
        const user = members.find(m => m.userId === r.userId)?.user

        // Upsert into PlayerRanking table
        await prisma.playerRanking.upsert({
          where: { tournamentId_userId: { tournamentId: id, userId: r.userId } },
          update: {
            position: index + 1,
            points: r.points,
            matchesPlayed: r.matchesPlayed,
            wins: r.wins,
            losses: r.losses,
            winsByWO: r.winsByWO,
            lossesByWO: r.lossesByWO,
            setsWon: r.setsWon,
            setsLost: r.setsLost,
            gamesWon: r.gamesWon,
            gamesLost: r.gamesLost,
            setBalance: r.setBalance,
            gamesBalance: r.gamesBalance,
          },
          create: {
            tournamentId: id,
            userId: r.userId,
            position: index + 1,
            points: r.points,
            matchesPlayed: r.matchesPlayed,
            wins: r.wins,
            losses: r.losses,
            winsByWO: r.winsByWO,
            lossesByWO: r.lossesByWO,
            setsWon: r.setsWon,
            setsLost: r.setsLost,
            gamesWon: r.gamesWon,
            gamesLost: r.gamesLost,
            setBalance: r.setBalance,
            gamesBalance: r.gamesBalance,
          }
        })

        return { ...r, position: index + 1, user: user || { id: r.userId, name: "?" } }
      })
    )

    return NextResponse.json({ ranking: enrichedRanking })
  } catch (error) {
    console.error("Erro ao buscar ranking:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

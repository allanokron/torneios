import prisma from "@/lib/prisma"

const DEFAULT_SCORING = {
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

const DEFAULT_TIEBREAKER_ORDER = [
  "points",
  "wins",
  "direct_confrontation",
  "set_balance",
  "sets_won",
  "games_balance",
  "games_won",
  "fewer_wo",
  "draw",
]

type RankingStats = {
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
}

type ChallengeStats = {
  challengePoints: number
  challengeMatches: number
  challengeWins: number
  challengeLosses: number
}

type RankingRow = RankingStats & {
  userId: string
  user: {
    id: string
    name: string
    avatarUrl: string | null
    city: string | null
    state: string | null
  }
  position: number
  points: number
  basePoints: number
  setBalance: number
  gamesBalance: number
  challengePoints: number
  challengeMatches: number
  challengeWins: number
  challengeLosses: number
}

function emptyStats(): RankingStats {
  return {
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

function emptyChallengeStats(): ChallengeStats {
  return {
    challengePoints: 0,
    challengeMatches: 0,
    challengeWins: 0,
    challengeLosses: 0,
  }
}

function normalizeCriteriaOrder(criteriaOrder: unknown): string[] {
  if (!Array.isArray(criteriaOrder)) return DEFAULT_TIEBREAKER_ORDER

  const validCriteria = criteriaOrder.filter((criteria): criteria is string => typeof criteria === "string")
  return validCriteria.length > 0 ? validCriteria : DEFAULT_TIEBREAKER_ORDER
}

function compareNumbers(a: number, b: number, direction: "asc" | "desc" = "desc") {
  return direction === "desc" ? b - a : a - b
}

function parseMonthToEndOfMonth(month: string): Date {
  const [m, y] = month.split("/").map(Number)
  return new Date(y, m, 0, 23, 59, 59, 999)
}

export async function recalculateTournamentRanking(tournamentId: string, month?: string) {
  const [members, existingRankings, tournament, penalties, finishedMatches, challengeMatches] = await Promise.all([
    prisma.tournamentMember.findMany({
      where: { tournamentId, status: "accepted" },
      include: {
        user: {
          select: { id: true, name: true, avatarUrl: true, city: true, state: true },
        },
      },
    }),
    prisma.playerRanking.findMany({
      where: { tournamentId },
    }),
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { scoringConfig: true, tiebreakerConfig: true, challengeConfig: true },
    }),
    prisma.penalty.findMany({
      where: { tournamentId },
    }),
    prisma.match.findMany({
      where: {
        tournamentId,
        phase: "ranking",
        status: { in: ["finished", "wo"] },
        isChallenge: false,
        ...(month
          ? {
              OR: [
                { scheduledAt: { lte: parseMonthToEndOfMonth(month) } },
                { month: month, scheduledAt: null },
              ],
            }
          : {}),
      },
      include: { sets: true },
    }),
    prisma.match.findMany({
      where: {
        tournamentId,
        phase: "ranking",
        status: { in: ["finished", "wo"] },
        isChallenge: true,
        ...(month
          ? {
              OR: [
                { scheduledAt: { lte: parseMonthToEndOfMonth(month) } },
                { month: month, scheduledAt: null },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        homePlayerId: true,
        awayPlayerId: true,
        challengePoints: true,
      },
    }),
  ])

  const scoring = tournament?.scoringConfig ?? DEFAULT_SCORING
  const challengeConfig = tournament?.challengeConfig
  const criteriaOrder = normalizeCriteriaOrder(tournament?.tiebreakerConfig?.criteriaOrder)
  const existingMap = new Map(existingRankings.map((ranking) => [ranking.userId, ranking]))
  const matchStats: Record<string, RankingStats> = {}
  const challengeStats: Record<string, ChallengeStats> = {}

  for (const member of members) {
    matchStats[member.userId] = emptyStats()
    challengeStats[member.userId] = emptyChallengeStats()
  }

  for (const match of finishedMatches) {
    const homeId = match.homePlayerId
    const awayId = match.awayPlayerId

    matchStats[homeId] ??= emptyStats()
    matchStats[awayId] ??= emptyStats()

    const home = matchStats[homeId]
    const away = matchStats[awayId]

    home.matchesPlayed++
    away.matchesPlayed++

    if (match.status === "wo") {
      if (!match.winnerId) continue

      const winner = match.winnerId === homeId ? home : away
      const loser = match.winnerId === homeId ? away : home

      winner.wins++
      winner.winsByWO++
      winner.matchPoints += scoring.winByWO
      loser.losses++
      loser.lossesByWO++
      loser.matchPoints += scoring.lossByWO

      const winnerSets = scoring.woWinSets ?? DEFAULT_SCORING.woWinSets
      const loserSets = scoring.woLossSets ?? DEFAULT_SCORING.woLossSets
      const winnerGames = scoring.woWinGames ?? DEFAULT_SCORING.woWinGames
      const loserGames = scoring.woLossGames ?? DEFAULT_SCORING.woLossGames

      winner.setsWon += winnerSets
      winner.setsLost += loserSets
      winner.gamesWon += winnerGames
      winner.gamesLost += loserGames
      loser.setsWon += loserSets
      loser.setsLost += winnerSets
      loser.gamesWon += loserGames
      loser.gamesLost += winnerGames
      continue
    }

    const homeSetsWon = match.sets.filter((set) => set.homeGames > set.awayGames).length
    const awaySetsWon = match.sets.filter((set) => set.awayGames > set.homeGames).length
    const homeGamesTotal = match.sets.reduce((sum, set) => sum + set.homeGames, 0)
    const awayGamesTotal = match.sets.reduce((sum, set) => sum + set.awayGames, 0)
    const winnerId = match.winnerId ?? (homeSetsWon > awaySetsWon ? homeId : awayId)
    const homeIsWinner = winnerId === homeId

    home.setsWon += homeSetsWon
    home.setsLost += awaySetsWon
    home.gamesWon += homeGamesTotal
    home.gamesLost += awayGamesTotal
    away.setsWon += awaySetsWon
    away.setsLost += homeSetsWon
    away.gamesWon += awayGamesTotal
    away.gamesLost += homeGamesTotal

    if (match.endReason === "forfeit") {
      const winner = homeIsWinner ? home : away
      const loser = homeIsWinner ? away : home

      winner.wins++
      winner.matchPoints += scoring.winByForfeit
      loser.losses++
      loser.matchPoints += scoring.lossByForfeit
      continue
    }

    if (homeIsWinner) {
      home.wins++
      away.losses++
      home.matchPoints += awaySetsWon === 0 ? scoring.winWithoutLosingSet : scoring.winLosingOneSet
      away.matchPoints += awaySetsWon > 0 ? scoring.lossWinningOneSet : scoring.lossWithoutWinningSet
    } else {
      away.wins++
      home.losses++
      away.matchPoints += homeSetsWon === 0 ? scoring.winWithoutLosingSet : scoring.winLosingOneSet
      home.matchPoints += homeSetsWon > 0 ? scoring.lossWinningOneSet : scoring.lossWithoutWinningSet
    }
  }

  // Accumulate challenge stats
  // challengePoints on match = challenger's points (positive = challenger won, negative = challenger lost)
  // Challenger is always the home player (set at match creation via PATCH)
  for (const match of challengeMatches) {
    if (match.challengePoints === null) continue

    const homeId = match.homePlayerId
    const awayId = match.awayPlayerId

    challengeStats[homeId] ??= emptyChallengeStats()
    challengeStats[awayId] ??= emptyChallengeStats()

    const homeCs = challengeStats[homeId]
    const awayCs = challengeStats[awayId]

    homeCs.challengeMatches++
    awayCs.challengeMatches++

    // Home player is the challenger, challengePoints is from challenger's perspective
    homeCs.challengePoints += match.challengePoints
    awayCs.challengePoints -= match.challengePoints

    const challengerWon = match.challengePoints > 0
    if (challengerWon) {
      homeCs.challengeWins++
      awayCs.challengeLosses++
    } else {
      awayCs.challengeWins++
      homeCs.challengeLosses++
    }

    // Optionally count wins/losses, sets, games in normal stats
    if (challengeConfig?.countWins) {
      const homeMs = matchStats[homeId] ?? emptyStats()
      const awayMs = matchStats[awayId] ?? emptyStats()
      if (challengerWon) {
        homeMs.wins++
        awayMs.losses++
      } else {
        awayMs.wins++
        homeMs.losses++
      }
    }
    if (challengeConfig?.countSets) {
      const homeMs = matchStats[homeId] ?? emptyStats()
      const awayMs = matchStats[awayId] ?? emptyStats()
      homeMs.setsWon += 2
      awayMs.setsLost += 2
    }
    if (challengeConfig?.countGames) {
      const homeMs = matchStats[homeId] ?? emptyStats()
      const awayMs = matchStats[awayId] ?? emptyStats()
      homeMs.gamesWon += 12
      awayMs.gamesLost += 12
    }
  }

  const ranking = await Promise.all(
    members.map(async (member) => {
      const stats = matchStats[member.userId] ?? emptyStats()
      const cs = challengeStats[member.userId] ?? emptyChallengeStats()
      const existing = existingMap.get(member.userId)
      const basePoints = existing?.basePoints ?? 0
      const penaltyPoints = penalties
        .filter((penalty) => penalty.userId === member.userId)
        .reduce((sum, penalty) => sum + penalty.points, 0)
      const points = basePoints + stats.matchPoints + penaltyPoints + cs.challengePoints
      const setBalance = stats.setsWon - stats.setsLost
      const gamesBalance = stats.gamesWon - stats.gamesLost

      const rankingRow: RankingRow = {
        userId: member.userId,
        user: member.user,
        position: 0,
        points,
        basePoints,
        ...stats,
        setBalance,
        gamesBalance,
        challengePoints: cs.challengePoints,
        challengeMatches: cs.challengeMatches,
        challengeWins: cs.challengeWins,
        challengeLosses: cs.challengeLosses,
      }

      if (!month) {
        await prisma.playerRanking.upsert({
          where: { tournamentId_userId: { tournamentId, userId: member.userId } },
          update: {
            points,
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
            challengePoints: cs.challengePoints,
            challengeMatches: cs.challengeMatches,
            challengeWins: cs.challengeWins,
            challengeLosses: cs.challengeLosses,
          },
          create: {
            tournamentId,
            userId: member.userId,
            position: 0,
            points,
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
            challengePoints: cs.challengePoints,
            challengeMatches: cs.challengeMatches,
            challengeWins: cs.challengeWins,
            challengeLosses: cs.challengeLosses,
          },
        })
      }

      return rankingRow
    })
  )

  ranking.sort((a, b) => compareRankingRows(a, b, criteriaOrder, finishedMatches))

  if (month) {
    return ranking.map((row, index) => ({ ...row, position: index + 1 }))
  }

  return Promise.all(
    ranking.map(async (row, index) => {
      const position = index + 1
      await prisma.playerRanking.update({
        where: { tournamentId_userId: { tournamentId, userId: row.userId } },
        data: { position },
      })
      return { ...row, position }
    })
  )
}

function compareRankingRows(
  a: RankingRow,
  b: RankingRow,
  criteriaOrder: string[],
  matches: Awaited<ReturnType<typeof prisma.match.findMany>>
) {
  for (const criteria of criteriaOrder) {
    let result = 0

    switch (criteria) {
      case "points":
        result = compareNumbers(a.points, b.points)
        break
      case "wins":
        result = compareNumbers(a.wins, b.wins)
        break
      case "direct_confrontation":
        result = compareDirectConfrontation(a.userId, b.userId, matches)
        break
      case "set_balance":
        result = compareNumbers(a.setBalance, b.setBalance)
        break
      case "sets_won":
        result = compareNumbers(a.setsWon, b.setsWon)
        break
      case "games_balance":
        result = compareNumbers(a.gamesBalance, b.gamesBalance)
        break
      case "games_won":
        result = compareNumbers(a.gamesWon, b.gamesWon)
        break
      case "fewer_wo":
        result = compareNumbers(a.lossesByWO, b.lossesByWO, "asc")
        break
      case "draw":
        result = 0
        break
    }

    if (result !== 0) return result
  }

  return (
    compareNumbers(a.points, b.points) ||
    compareNumbers(a.wins, b.wins) ||
    compareNumbers(a.setBalance, b.setBalance) ||
    compareNumbers(a.gamesBalance, b.gamesBalance) ||
    a.user.name.localeCompare(b.user.name)
  )
}

function compareDirectConfrontation(
  playerAId: string,
  playerBId: string,
  matches: Awaited<ReturnType<typeof prisma.match.findMany>>
) {
  let playerAWins = 0
  let playerBWins = 0

  for (const match of matches) {
    const isHeadToHead =
      (match.homePlayerId === playerAId && match.awayPlayerId === playerBId) ||
      (match.homePlayerId === playerBId && match.awayPlayerId === playerAId)

    if (!isHeadToHead || !match.winnerId) continue

    if (match.winnerId === playerAId) playerAWins++
    if (match.winnerId === playerBId) playerBWins++
  }

  return compareNumbers(playerAWins, playerBWins)
}

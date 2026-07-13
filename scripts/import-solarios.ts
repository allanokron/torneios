import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TOURNAMENT_ID = "cmrfc8dl7000090vgl4120suv"

const playerMap: Record<string, string> = {
  "DU": "cmrfet6lj0009ufvgg5l9r40j",
  "JANICE": "cmrfet63a0006ufvgqbhpo86s",
  "MARCOS": "cmrfeth1m001xufvgah79poiy",
  "CARLOS": "cmrfet8q1000lufvg3xt6srnq",
  "EZEQUIAS": "cmrfetde7001cufvgrj0mlo0m",
  "MATHEUS": "cmrfeti260023ufvgog85bc4d",
  "CHINA": "cmrfetbd10010ufvg2gvd8v9t",
  "CID": "cmrfetdx1001fufvg3nxri93z",
  "ULYSSES": "cmrfetcdo0016ufvgfbz2x50i",
  "EVERTON": "cmrfet98c000oufvgju7urc3c",
  "THIAGO": "cmrfet5iz0003ufvgp58hh1wf",
  "ALÊ": "cmrfet9qk000rufvgfp58ax8j",
  "LUIZ": "cmrfetexk001lufvgb8mjqiul",
  "EDSON": "cmrfet73p000cufvgqa3b4do6",
}

type ScheduledMatch = {
  p1: string
  p2: string
  date: string // ISO date
  time: string
}

const scheduledMatches: ScheduledMatch[] = [
  { p1: "DU", p2: "JANICE", date: "2026-07-14", time: "18:00" },
  { p1: "MARCOS", p2: "CARLOS", date: "2026-07-15", time: "20:00" },
  { p1: "EZEQUIAS", p2: "MATHEUS", date: "2026-07-16", time: "18:00" },
  { p1: "CHINA", p2: "CID", date: "2026-07-16", time: "19:30" },
  { p1: "ULYSSES", p2: "CID", date: "2026-07-18", time: "07:30" },
  { p1: "EVERTON", p2: "MARCOS", date: "2026-07-18", time: "09:00" },
  { p1: "EVERTON", p2: "THIAGO", date: "2026-07-19", time: "07:00" },
  { p1: "ALÊ", p2: "LUIZ", date: "2026-07-25", time: "08:15" },
  { p1: "CHINA", p2: "EDSON", date: "2026-07-25", time: "16:00" },
  { p1: "EVERTON", p2: "CID", date: "2026-07-26", time: "07:30" },
]

type CompletedMatch = {
  p1: string
  p2: string
  set1_p1: number
  set1_p2: number
  set2_p1: number
  set2_p2: number
  winner: string
}

const completedMatches: CompletedMatch[] = [
  { p1: "ULYSSES", p2: "DU", set1_p1: 6, set1_p2: 2, set2_p1: 6, set2_p2: 2, winner: "ULYSSES" },
]

async function main() {
  const tournament = await prisma.tournament.findUnique({ where: { id: TOURNAMENT_ID } })
  if (!tournament) { console.error("Tournament not found!"); process.exit(1) }

  const scoringConfig = await prisma.scoringConfig.findUnique({ where: { tournamentId: TOURNAMENT_ID } })
  if (!scoringConfig) { console.error("Scoring config not found!"); process.exit(1) }

  // === 1. Create scheduled matches ===
  console.log("\n=== Creating scheduled matches ===")
  let scheduledCount = 0

  for (const m of scheduledMatches) {
    const homeId = playerMap[m.p1]
    const awayId = playerMap[m.p2]
    if (!homeId || !awayId) {
      console.error(`Player not found: ${!homeId ? m.p1 : m.p2}`)
      continue
    }

    // Check if match already exists
    const existing = await prisma.match.findFirst({
      where: {
        tournamentId: TOURNAMENT_ID,
        OR: [
          { homePlayerId: homeId, awayPlayerId: awayId },
          { homePlayerId: awayId, awayPlayerId: homeId }
        ],
        scheduledAt: {
          gte: new Date(`${m.date}T00:00:00`),
          lt: new Date(`${m.date}T23:59:59`)
        }
      }
    })
    if (existing) {
      console.log(`Skipping existing: ${m.p1} x ${m.p2} (${m.date})`)
      continue
    }

    const scheduledAt = new Date(`${m.date}T${m.time}:00`)

    await prisma.match.create({
      data: {
        tournamentId: TOURNAMENT_ID,
        homePlayerId: homeId,
        awayPlayerId: awayId,
        scheduledAt,
        duration: tournament.defaultMatchDuration,
        status: "scheduled",
        phase: "ranking",
      }
    })

    console.log(`Created: ${m.p1} x ${m.p2} - ${m.date} ${m.time}`)
    scheduledCount++
  }

  // === 2. Create completed match ===
  console.log("\n=== Creating completed matches ===")
  let completedCount = 0

  for (const m of completedMatches) {
    const homeId = playerMap[m.p1]
    const awayId = playerMap[m.p2]
    if (!homeId || !awayId) {
      console.error(`Player not found: ${!homeId ? m.p1 : m.p2}`)
      continue
    }

    // Check if match already exists
    const existing = await prisma.match.findFirst({
      where: {
        tournamentId: TOURNAMENT_ID,
        OR: [
          { homePlayerId: homeId, awayPlayerId: awayId },
          { homePlayerId: awayId, awayPlayerId: homeId }
        ]
      }
    })
    if (existing) {
      console.log(`Skipping existing: ${m.p1} x ${m.p2}`)
      continue
    }

    const winnerId = playerMap[m.winner]
    if (!winnerId) {
      console.error(`Winner not found: ${m.winner}`)
      continue
    }

    // Determine set wins
    let homeSetsWon = 0
    let awaySetsWon = 0
    const setsData = [
      { setNumber: 1, homeGames: m.set1_p1, awayGames: m.set1_p2 },
      { setNumber: 2, homeGames: m.set2_p1, awayGames: m.set2_p2 },
    ]

    if (m.set1_p1 > m.set1_p2) homeSetsWon++
    else awaySetsWon++

    if (m.set2_p1 > m.set2_p2) homeSetsWon++
    else awaySetsWon++

    // Create match
    const match = await prisma.match.create({
      data: {
        tournamentId: TOURNAMENT_ID,
        homePlayerId: homeId,
        awayPlayerId: awayId,
        duration: tournament.defaultMatchDuration,
        status: "finished",
        homeScore: homeSetsWon,
        awayScore: awaySetsWon,
        winnerId,
        finishedAt: new Date(),
        endReason: "normal",
        phase: "ranking",
        sets: { create: setsData }
      }
    })

    // Update rankings
    const homeGamesTotal = m.set1_p1 + m.set2_p1
    const awayGamesTotal = m.set1_p2 + m.set2_p2

    let homePoints = 0
    let awayPoints = 0

    if (homeSetsWon > awaySetsWon) {
      homePoints = awaySetsWon === 0 ? scoringConfig.winWithoutLosingSet : scoringConfig.winLosingOneSet
      awayPoints = homeSetsWon > 0 ? scoringConfig.lossWinningOneSet : scoringConfig.lossWithoutWinningSet
    } else {
      awayPoints = homeSetsWon === 0 ? scoringConfig.winWithoutLosingSet : scoringConfig.winLosingOneSet
      homePoints = awaySetsWon > 0 ? scoringConfig.lossWinningOneSet : scoringConfig.lossWithoutWinningSet
    }

    for (const playerId of [homeId, awayId]) {
      const isHome = playerId === homeId
      const isWinner = playerId === winnerId
      const points = isHome ? homePoints : awayPoints
      const setsWon = isHome ? homeSetsWon : awaySetsWon
      const setsLost = isHome ? awaySetsWon : homeSetsWon
      const gamesWon = isHome ? homeGamesTotal : awayGamesTotal
      const gamesLost = isHome ? awayGamesTotal : homeGamesTotal

      await prisma.playerRanking.upsert({
        where: { tournamentId_userId: { tournamentId: TOURNAMENT_ID, userId: playerId } },
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
          tournamentId: TOURNAMENT_ID,
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

    console.log(`Created: ${m.p1} ${m.set1_p1}x${m.set1_p2}, ${m.set2_p1}x${m.set2_p2} ${m.p2} → ${m.winner} vencedor`)
    completedCount++
  }

  console.log(`\nDone! Scheduled: ${scheduledCount}, Completed: ${completedCount}`)
}

main().catch(console.error).finally(() => prisma.$disconnect())

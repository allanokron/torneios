import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TOURNAMENT_ID = "cmrfc8dl7000090vgl4120suv"

const playerMap: Record<string, string> = {
  "MURILO": "cmrfetach000uufvg5gooj3g0",
  "JOAO GABRIEL": "cmrfetg14001rufvg48kx44g5",
  "JANICE": "cmrfet63a0006ufvgqbhpo86s",
  "ULYSSES": "cmrfetcdo0016ufvgfbz2x50i",
  "GUSTAVO": "cmrfet7pi000fufvg8fo9kz6m",
  "LUIZ": "cmrfetexk001lufvgb8mjqiul",
  "GIULIA": "cmrfetffu001oufvg24susa8w",
  "CHINA": "cmrfetbd10010ufvg2gvd8v9t",
  "EZEQUIAS": "cmrfetde7001cufvgrj0mlo0m",
  "CHRISTIAN": "cmrfet4cc0000ufvgrli0sd9l",
  "NICELIO": "cmrfetgjf001uufvgoji0q8gq",
  "EVERTON": "cmrfet98c000oufvgju7urc3c",
  "STEFAN": "cmrfetaus000xufvgkrmmy3qx",
  "CID": "cmrfetdx1001fufvg3nxri93z",
  "THIAGO": "cmrfet5iz0003ufvgp58hh1wf",
  "EDSON": "cmrfet73p000cufvgqa3b4do6",
  "GUILHERME": "cmrfethjx0020ufvg8mvzztt8",
  "ALÊ": "cmrfet9qk000rufvgfp58ax8j",
  "BONA": "cmrfetef9001iufvgj89nf9p9",
  "ALINE": "cmrfetbvb0013ufvgw3qbftz7",
  "SAMUEL": "cmrfet87r000iufvgb1i0vy3h",
  "DU": "cmrfet6lj0009ufvgg5l9r40j",
  "CARLOS": "cmrfet8q1000lufvg3xt6srnq",
  "LUKINHA": "cmrfetcvx0019ufvgitmt42fb",
  "MARCOS": "cmrfeth1m001xufvgah79poiy",
}

const matches = [
  { p1: "ALINE", p1s: [6, 6], p2: "JOAO GABRIEL", p2s: [1, 1] },
  { p1: "ALÊ", p1s: [6, 4], p2: "ULYSSES", p2s: [7, 6] },
  { p1: "NICELIO", p1s: [2, 1], p2: "GUSTAVO", p2s: [6, 6] },
  { p1: "LUKINHA", p1s: [1, 3], p2: "JANICE", p2s: [6, 6] },
  { p1: "ALINE", p1s: [6, 7], p2: "ULYSSES", p2s: [3, 5] },
  { p1: "EZEQUIAS", p1s: [2, 2], p2: "GUSTAVO", p2s: [6, 6] },
  { p1: "SAMUEL", p1s: [2, 3], p2: "THIAGO", p2s: [6, 6] },
  { p1: "CHRISTIAN", p1s: [6, 6], p2: "EDSON", p2s: [3, 0] },
]

async function main() {
  const scoringConfig = await prisma.scoringConfig.findUnique({
    where: { tournamentId: TOURNAMENT_ID }
  })
  if (!scoringConfig) { console.error("No scoring config"); process.exit(1) }

  const tournament = await prisma.tournament.findUnique({ where: { id: TOURNAMENT_ID } })
  if (!tournament) { console.error("No tournament"); process.exit(1) }

  for (const m of matches) {
    const homeId = playerMap[m.p1]
    const awayId = playerMap[m.p2]
    if (!homeId || !awayId) { console.error(`Player not found: ${!homeId ? m.p1 : m.p2}`); continue }

    const existing = await prisma.match.findFirst({
      where: {
        tournamentId: TOURNAMENT_ID,
        OR: [
          { homePlayerId: homeId, awayPlayerId: awayId },
          { homePlayerId: awayId, awayPlayerId: homeId }
        ]
      }
    })
    if (existing) { console.log(`Skipping existing: ${m.p1} vs ${m.p2}`); continue }

    let homeSetsWon = 0, awaySetsWon = 0
    const setsData = m.p1s.map((g, i) => {
      const ag = m.p2s[i] ?? 0
      if (g > ag) homeSetsWon++
      else if (ag > g) awaySetsWon++
      return { setNumber: i + 1, homeGames: g, awayGames: ag }
    })

    const winnerId = homeSetsWon > awaySetsWon ? homeId : awayId

    await prisma.match.create({
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
        sets: { create: setsData }
      }
    })

    const homeGamesTotal = setsData.reduce((s, x) => s + x.homeGames, 0)
    const awayGamesTotal = setsData.reduce((s, x) => s + x.awayGames, 0)

    let homePoints = 0, awayPoints = 0
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
      await prisma.playerRanking.upsert({
        where: { tournamentId_userId: { tournamentId: TOURNAMENT_ID, userId: playerId } },
        update: {
          points: { increment: isHome ? homePoints : awayPoints },
          matchesPlayed: { increment: 1 },
          wins: isWinner ? { increment: 1 } : undefined,
          losses: !isWinner ? { increment: 1 } : undefined,
          setsWon: { increment: isHome ? homeSetsWon : awaySetsWon },
          setsLost: { increment: isHome ? awaySetsWon : homeSetsWon },
          gamesWon: { increment: isHome ? homeGamesTotal : awayGamesTotal },
          gamesLost: { increment: isHome ? awayGamesTotal : homeGamesTotal },
          setBalance: { increment: (isHome ? homeSetsWon : awaySetsWon) - (isHome ? awaySetsWon : homeSetsWon) },
          gamesBalance: { increment: (isHome ? homeGamesTotal : awayGamesTotal) - (isHome ? awayGamesTotal : homeGamesTotal) }
        },
        create: {
          tournamentId: TOURNAMENT_ID,
          userId: playerId,
          position: 0,
          points: isHome ? homePoints : awayPoints,
          matchesPlayed: 1,
          wins: isWinner ? 1 : 0,
          losses: isWinner ? 0 : 1,
          setsWon: isHome ? homeSetsWon : awaySetsWon,
          setsLost: isHome ? awaySetsWon : homeSetsWon,
          gamesWon: isHome ? homeGamesTotal : awayGamesTotal,
          gamesLost: isHome ? awayGamesTotal : homeGamesTotal,
          setBalance: (isHome ? homeSetsWon : awaySetsWon) - (isHome ? awaySetsWon : homeSetsWon),
          gamesBalance: (isHome ? homeGamesTotal : awayGamesTotal) - (isHome ? awayGamesTotal : homeGamesTotal)
        }
      })
    }

    console.log(`Created: ${m.p1} ${m.p1s.join("-")} vs ${m.p2} ${m.p2s.join("-")} → ${m.p1} ${homeSetsWon}x${awaySetsWon} ${m.p2}`)
  }

  console.log("\nDone!")
}

main().catch(console.error).finally(() => prisma.$disconnect())

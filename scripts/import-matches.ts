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

// Raw match data: [player1, set1_p1, set2_p1, set3_p1, player2, set1_p2, set2_p2, set3_p2]
type MatchRaw = {
  p1: string
  p1s: (number | null)[]
  p2: string
  p2s: (number | null)[]
  woWinner?: string // if W.O., who wins
}

function parseScore(v: string): number | null {
  if (v === "" || v === "W.O." || v === undefined || v === null) return null
  const n = parseInt(v, 10)
  return isNaN(n) ? null : n
}

function parseMatches(rawText: string): MatchRaw[] {
  const lines = rawText.trim().split("\n")
  const matches: MatchRaw[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line || line.startsWith("TENISTA")) continue

    // Split by tab or multiple spaces
    const parts = line.split(/\t+/)
    if (parts.length < 2) continue

    const p1Name = parts[0].trim()
    const p2Name = parts[1].trim()
    const scores = parts.slice(2).map(s => s.trim())

    if (!p1Name || !p2Name) continue

    // Check for W.O.
    if (scores.some(s => s === "W.O.")) {
      // W.O. - need to figure out who won based on user instructions:
      // All Giulia W.O. = she lost (other player wins)
      // Du vs Stefan W.O. = Du lost (Stefan wins)
      let woWinner: string
      if (p1Name === "GIULIA") {
        woWinner = p2Name
      } else if (p2Name === "GIULIA") {
        woWinner = p1Name
      } else if (p1Name === "DU" && p2Name === "STEFAN") {
        woWinner = "STEFAN"
      } else if (p1Name === "STEFAN" && p2Name === "DU") {
        woWinner = "STEFAN"
      } else {
        // Default: the player without W.O. next to their name wins
        woWinner = p2Name
      }

      matches.push({
        p1: p1Name,
        p1s: [null, null, null],
        p2: p2Name,
        p2s: [null, null, null],
        woWinner
      })
      continue
    }

    // Parse scores
    // Format varies: some have 2 scores (2-set match), some have 3 (3-set match)
    // But they're arranged as: p1_name, p2_name, set1_p1, set2_p1, set3_p1, set1_p2, set2_p2, set3_p2
    // Wait, looking at the data more carefully:
    // TENISTA  1o SET  2o SET  3o SET
    // MURILO   6       6
    // JOAO GABRIEL 0    0

    // So each line is: player_name  set1_score  set2_score  set3_score(if exists)
    // And pairs of lines form a match

    // Actually re-reading the format, it seems like each match is TWO consecutive lines:
    // Line 1: Player1 scores
    // Line 2: Player2 scores

    // So I need to pair them up. Let me re-parse.
    matches.length = 0 // reset, we'll parse differently
    break
  }

  return matches
}

// Reparse: pairs of lines
function parseMatchPairs(rawText: string): MatchRaw[] {
  const lines = rawText.trim().split("\n")
  const matches: MatchRaw[] = []
  const dataLines: { name: string; scores: string[] }[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith("TENISTA")) continue

    const parts = trimmed.split(/\t+/)
    if (parts.length < 2) continue

    const name = parts[0].trim()
    const scores = parts.slice(1).map(s => s.trim())

    if (!name) continue
    dataLines.push({ name, scores })
  }

  // Pair up consecutive lines
  for (let i = 0; i < dataLines.length - 1; i += 2) {
    const p1 = dataLines[i]
    const p2 = dataLines[i + 1]

    if (!p1 || !p2) continue

    // Check for W.O. in scores
    const allScores = [...p1.scores, ...p2.scores]
    if (allScores.some(s => s === "W.O.")) {
      let woWinner: string
      if (p1.name === "GIULIA") {
        woWinner = p2.name
      } else if (p2.name === "GIULIA") {
        woWinner = p1.name
      } else if (p1.name === "DU" && p2.name === "STEFAN") {
        woWinner = "STEFAN"
      } else if (p1.name === "STEFAN" && p2.name === "DU") {
        woWinner = "STEFAN"
      } else {
        woWinner = p2.name
      }

      matches.push({
        p1: p1.name,
        p1s: [null, null, null],
        p2: p2.name,
        p2s: [null, null, null],
        woWinner
      })
      continue
    }

    // Parse scores
    const p1Scores = p1.scores.map(parseScore)
    const p2Scores = p2.scores.map(parseScore)

    // Pad to 3 elements
    while (p1Scores.length < 3) p1Scores.push(null)
    while (p2Scores.length < 3) p2Scores.push(null)

    matches.push({
      p1: p1.name,
      p1s: p1Scores.slice(0, 3),
      p2: p2.name,
      p2s: p2Scores.slice(0, 3),
    })
  }

  return matches
}

async function main() {
  const rawText = `
MURILO	6	6
JOAO GABRIEL	0	0
JANICE	3	6	6
ULYSSES	6	4	3
GUSTAVO	6	7
LUIZ	3	5
GIULIA	7	3	2
CHINA	5	6	6
EZEQUIAS	2	3
CHRISTIAN	6	6
NICELIO	0	2
EVERTON	6	6
STEFAN	3	1
CID	6	6
THIAGO	2	6	6
EDSON	6	0	1
GUILHERME	0	1
ALÊ	6	6
BONA	5	3
ALINE	7	6
SAMUEL	2	6	2
DU	6	3	6
CARLOS	7	6
LUKINHA	6	1
MURILO	7	6
CID	5	2
STEFAN	2	4
EDSON	6	6
THIAGO	6	6
ALÊ	2	2
GUILHERME	1	0
ALINE	6	6
BONA	4	2
DU	6	6
SAMUEL	6	6
LUKINHA	1	1
JOAO GABRIEL	0	2
ULYSSES	6	6
JANICE	6	6
LUIZ	1	0
GUSTAVO	7	6
CHINA	5	3
GIULIA	0	2
CHRISTIAN	6	6
EZEQUIAS	3	4
EVERTON	6	6
NICELIO	0	0
CARLOS	6	6
MURILO	6	6
ULYSSES	3	1
JOAO GABRIEL	1	1
LUIZ	6	6
JANICE	6	7
CHINA	1	5
GUSTAVO	2	0
CHRISTIAN	6	6
GIULIA	5	4
EVERTON	7	6
EZEQUIAS	3	3
CARLOS	6	6
CID	3	5
EDSON	6	7
STEFAN	2	2
ALÊ	6	6
THIAGO	6	6	6
ALINE	7	0	3
GUILHERME	4	2
DU	6	6
BONA	0	0
LUKINHA	6	6
SAMUEL	6	6
NICELIO	1	0
MURILO	6	2
EDSON	7	6
CID	2	4
ALÊ	6	6
STEFAN	7	6
ALINE	6	4
THIAGO	6	6
DU	4	4
GUILHERME	4	2
LUKINHA	6	6
BONA	6	6
NICELIO	3	0
ULYSSES	6	6
LUIZ	2	2
JOAO GABRIEL	1	0
CHINA	6	6
JANICE	5	6
CHRISTIAN	7	7
GUSTAVO	6	6
EVERTON	4	4
GIULIA	0	0
CARLOS	6	6
EZEQUIAS	2	7	2
SAMUEL	6	6	6
MURILO	6	6
LUIZ	0	0
ULYSSES	4	6
CHINA	6	7
JOAO GABRIEL	0	0
CHRISTIAN	6	6
JANICE	6	6
EVERTON	2	1
GUSTAVO	6	4	6
CARLOS	4	6	7
GIULIA	1	4
SAMUEL	6	6
EDSON	6	7
ALÊ	2	6
CID	3	1
ALINE	6	6
STEFAN	W.O.
DU	W.O.
THIAGO	6	6
LUKINHA	2	2
GUILHERME	6	4	3
NICELIO	2	6	6
BONA	3	4
EZEQUIAS	6	6
MURILO	6	6	6
ALÊ	3	7	1
EDSON	7	6	6
ALINE	5	7	2
CID	2	2
DU	6	6
STEFAN	3	6	6
LUKINHA	6	4	1
THIAGO	6	6
NICELIO	1	2
GUILHERME	3	3
EZEQUIAS	6	6
LUIZ	2	0
CHINA	6	6
ULYSSES	6	1	2
CHRISTIAN	4	6	6
JOAO GABRIEL	3	2
EVERTON	6	6
JANICE	6	6
CARLOS	0	0
GUSTAVO	6	6	2
SAMUEL	7	4	6
GIULIA	6	6
BONA	4	3
MURILO	6	7
CHINA	2	5
LUIZ	0	2
CHRISTIAN	6	6
ULYSSES	4	4
EVERTON	6	6
JOAO GABRIEL	0	0
CARLOS	6	6
JANICE	6	6
SAMUEL	3	3
GUSTAVO	6	6
BONA	1	1
ALÊ	6	6
ALINE	4	4
EDSON	6	6
DU	4	2
CID	6	4	5
LUKINHA	4	6	7
STEFAN	6	6
NICELIO	1	3
THIAGO	6	6
EZEQUIAS	4	4
DU	7	6	6
CHINA	6	1	4
GUILHERME	2	4
GIULIA	6	6
MURILO	7	6
ALINE	5	2
ALÊ	1	4
DU	4	6
EDSON	7	6
LUKINHA	6	2
CID	6	6
NICELIO	1	2
STEFAN	6	1	6
EZEQUIAS	2	6	3
THIAGO	6	6
GIULIA	2	2
CHINA	1	2
CHRISTIAN	6	6
LUIZ	3	5
EVERTON	6	7
ULYSSES	2	6	7
CARLOS	6	3	5
JOAO GABRIEL	1	0
SAMUEL	6	6
JANICE	6	6
BONA	0	0
GUSTAVO	6	6
GUILHERME	0	0
MURILO	1	2
CHRISTIAN	6	6
CHINA	5	3
EVERTON	7	6
LUIZ	0	0
CARLOS	6	6
ULYSSES	5	6	7
SAMUEL	7	3	6
JOAO GABRIEL	1	0
BONA	6	6
JANICE	6	6
GUILHERME	0	0
ALINE	5	1
DU	7	6
ALÊ	6	6	6
LUKINHA	3	7	3
EDSON	6	6
NICELIO	0	0
CID	5	3
EZEQUIAS	7	6
STEFAN	6	6
GIULIA	0	2
THIAGO	6	6
GUSTAVO	2	4
MURILO	3	6	2
DU	6	1	6
ALINE	6	6	6
LUKINHA	4	7	1
ALÊ	6	6
NICELIO	1	1
EDSON	6	6
EZEQUIAS	2	2
CID	6	6
GIULIA	1	2
STEFAN	2	2
GUSTAVO	6	6
CHRISTIAN	6	6
EVERTON	1	1
CHINA	5	7	7
CARLOS	7	6	5
LUIZ	1	2
SAMUEL	6	6
ULYSSES	6	6
BONA	2	4
JOAO GABRIEL	6	6
GUILHERME	2	4
JANICE	6	2	5
THIAGO	4	6	7
MURILO
EVERTON
CHRISTIAN	6	6
CARLOS	2	1
CHINA	6	2	3
SAMUEL	4	6	6
LUIZ	6	3	6
BONA	3	6	4
ULYSSES	6	6	6
MARCOS	4	7	2
JOAO GABRIEL	1	2
THIAGO	6	6
DU	6	6
LUKINHA	1	3
ALINE	6	6
NICELIO	0	1
ALÊ	6	2	6
EZEQUIAS	2	6	2
EDSON	7	6
GIULIA	6	1
CID	3	4
GUSTAVO	6	6
STEFAN	2	4
JANICE	6	6
MURILO	3	6	6
LUKINHA	6	0	2
DU	6	6
NICELIO	4	0
ALINE	6	6	6
EZEQUIAS	7	2	4
ALÊ	W.O.
GIULIA	W.O.
EDSON	6	6	5
GUSTAVO	2	7	7
CID	2	1
JANICE	6	6
EVERTON	1	6	6
CARLOS	6	3	4
CHRISTIAN	6	6
SAMUEL	1	1
CHINA	7	6
BONA	5	0
LUIZ	1	6	3
MARCOS	6	3	6
ULYSSES	1	4
THIAGO	6	6
JOAO GABRIEL	1	2
STEFAN	6	6
MURILO	6	6
CARLOS	4	4
EVERTON	0	6	6
SAMUEL	6	3	7
CHRISTIAN	6	6
BONA	1	0
CHINA	7	0	0
MARCOS	5	6	6
LUIZ	2	0
THIAGO	6	6
ULYSSES	6	6
STEFAN	3	4
LUKINHA	6	6
NICELIO	1	1
DU	6	6	4
EZEQUIAS	7	4	6
ALINE	W.O.
GIULIA	W.O.
ALÊ	6	2
GUSTAVO	7	6
EDSON
JANICE
CID	6	6
JOAO GABRIEL	1	1
MURILO
NICELIO
LUKINHA	4	6	6
EZEQUIAS	6	1	0
DU	W.O.
GIULIA	W.O.
ALINE	5	4
GUSTAVO	7	6
ALÊ	1	1
JANICE	6	6
EDSON	6	6
JOAO GABRIEL	3	0
CARLOS	6	3	0
SAMUEL	3	6	6
EVERTON	6	6
BONA	1	1
CHRISTIAN	6	6
MARCOS	1	0
CHINA	1	2
THIAGO	6	6
LUIZ	3	6
STEFAN	6	7
ULYSSES
CID
MURILO	6	2	7
SAMUEL	4	6	5
CARLOS	6	6
BONA	1	0
EVERTON
MARCOS
CHRISTIAN	6	3	6
THIAGO	4	6	4
CHINA	6	6
STEFAN	0	3
LUIZ	6	1
CID	7	6
NICELIO	2	2
EZEQUIAS	6	6
LUKINHA	W.O.
GIULIA	W.O.
DU	6	2	7
GUSTAVO	2	6	6
ALINE	0	0
JANICE	6	6
ALÊ	6	6
JOAO GABRIEL	3	2
EDSON	6	6
ULYSSES	4	2
`.trim()

  const matches = parseMatchPairs(rawText)
  console.log(`Parsed ${matches.length} matches`)

  // Verify all players exist
  for (const m of matches) {
    if (!playerMap[m.p1]) {
      console.error(`Player not found: ${m.p1}`)
      process.exit(1)
    }
    if (!playerMap[m.p2]) {
      console.error(`Player not found: ${m.p2}`)
      process.exit(1)
    }
  }

  // Get scoring config
  const scoringConfig = await prisma.scoringConfig.findUnique({
    where: { tournamentId: TOURNAMENT_ID }
  })

  if (!scoringConfig) {
    console.error("Scoring config not found!")
    process.exit(1)
  }

  console.log("Scoring config:", JSON.stringify(scoringConfig, null, 2))

  // Get tournament settings
  const tournament = await prisma.tournament.findUnique({
    where: { id: TOURNAMENT_ID }
  })

  if (!tournament) {
    console.error("Tournament not found!")
    process.exit(1)
  }

  const setsPerMatch = tournament.setsPerMatch
  console.log(`Sets per match: ${setsPerMatch}`)

  let createdCount = 0
  let skippedCount = 0
  let woCount = 0

  for (const m of matches) {
    const homeId = playerMap[m.p1]
    const awayId = playerMap[m.p2]

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
      console.log(`Skipping existing match: ${m.p1} vs ${m.p2}`)
      skippedCount++
      continue
    }

    // Check for W.O.
    if (m.woWinner) {
      const winnerId = playerMap[m.woWinner]
      const loserId = winnerId === homeId ? awayId : homeId

      const match = await prisma.match.create({
        data: {
          tournamentId: TOURNAMENT_ID,
          homePlayerId: homeId,
          awayPlayerId: awayId,
          duration: tournament.defaultMatchDuration,
          status: "wo",
          winnerId,
          woGivenById: loserId,
          woReceivedById: winnerId,
          woReason: "W.O.",
          finishedAt: new Date(),
          endReason: "wo"
        }
      })

      // Update ranking for W.O.
      const woWinSets = scoringConfig.woWinSets ?? 2
      const woLossSets = scoringConfig.woLossSets ?? 0
      const woWinGames = scoringConfig.woWinGames ?? 12
      const woLossGames = scoringConfig.woLossGames ?? 0

      for (const playerId of [homeId, awayId]) {
        const isWinner = playerId === winnerId
        const points = isWinner ? scoringConfig.winByWO : scoringConfig.lossByWO
        const setsWon = isWinner ? woWinSets : woLossSets
        const setsLost = isWinner ? woLossSets : woWinSets
        const gamesWon = isWinner ? woWinGames : woLossGames
        const gamesLost = isWinner ? woLossGames : woWinGames

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

      woCount++
      createdCount++
      continue
    }

    // Regular match - check if scores exist
    const hasScores = m.p1s.some(s => s !== null) || m.p2s.some(s => s !== null)
    if (!hasScores) {
      console.log(`Skipping match with no scores: ${m.p1} vs ${m.p2}`)
      skippedCount++
      continue
    }

    // Determine how many sets were played
    let numSets = 0
    for (let i = 0; i < 3; i++) {
      if (m.p1s[i] !== null || m.p2s[i] !== null) {
        numSets = i + 1
      }
    }

    // Build sets data
    const setsData: { setNumber: number; homeGames: number; awayGames: number }[] = []
    let homeSetsWon = 0
    let awaySetsWon = 0

    for (let i = 0; i < numSets; i++) {
      const homeGames = m.p1s[i] ?? 0
      const awayGames = m.p2s[i] ?? 0
      setsData.push({ setNumber: i + 1, homeGames, awayGames })

      if (homeGames > awayGames) homeSetsWon++
      else if (awayGames > homeGames) awaySetsWon++
    }

    const requiredSets = Math.ceil(setsPerMatch / 2)
    if (homeSetsWon < requiredSets && awaySetsWon < requiredSets) {
      console.log(`No winner in match: ${m.p1} (${homeSetsWon}) vs ${m.p2} (${awaySetsWon}) - sets: ${JSON.stringify(setsData)}`)
      skippedCount++
      continue
    }

    const winnerId = homeSetsWon > awaySetsWon ? homeId : awayId

    // Create match with sets
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
        sets: {
          create: setsData
        }
      }
    })

    // Update ranking
    const homeGamesTotal = setsData.reduce((sum, s) => sum + s.homeGames, 0)
    const awayGamesTotal = setsData.reduce((sum, s) => sum + s.awayGames, 0)

    // Determine scoring
    let homePoints = 0
    let awayPoints = 0

    if (homeSetsWon > awaySetsWon) {
      // Home wins
      homePoints = awaySetsWon === 0 ? scoringConfig.winWithoutLosingSet : scoringConfig.winLosingOneSet
      awayPoints = homeSetsWon > 0 ? scoringConfig.lossWinningOneSet : scoringConfig.lossWithoutWinningSet
    } else {
      // Away wins
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

    createdCount++
  }

  console.log(`\nDone! Created: ${createdCount}, W.O.: ${woCount}, Skipped: ${skippedCount}`)

  // Show rankings
  const rankings = await prisma.playerRanking.findMany({
    where: { tournamentId: TOURNAMENT_ID },
    include: { user: { select: { name: true } } },
    orderBy: { points: "desc" }
  })

  console.log("\nRankings:")
  for (let i = 0; i < rankings.length; i++) {
    const r = rankings[i]
    console.log(`${i + 1}º ${r.user.name}: ${r.points} pts (${r.matchesPlayed} jogos, ${r.wins}V ${r.losses}D, sets: ${r.setsWon}/${r.setsLost}, games: ${r.gamesWon}/${r.gamesLost})`)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

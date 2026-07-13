import "dotenv/config"
import { PrismaClient } from "../src/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TOURNAMENT_ID = "cmrfc8dl7000090vgl4120suv"

const playerMap: Record<string, string> = {
  "MURILO":      "cmrfetach000uufvg5gooj3g0",
  "JOAO GABRIEL": "cmrfetg14001rufvg48kx44g5",
  "JANICE":      "cmrfet63a0006ufvgqbhpo86s",
  "ULYSSES":     "cmrfetcdo0016ufvgfbz2x50i",
  "GUSTAVO":     "cmrfet7pi000fufvg8fo9kz6m",
  "LUIZ":        "cmrfetexk001lufvgb8mjqiul",
  "GIULIA":      "cmrfetffu001oufvg24susa8w",
  "CHINA":       "cmrfetbd10010ufvg2gvd8v9t",
  "EZEQUIAS":    "cmrfetde7001cufvgrj0mlo0m",
  "CHRISTIAN":   "cmrfet4cc0000ufvgrli0sd9l",
  "NICELIO":     "cmrfetgjf001uufvgoji0q8gq",
  "EVERTON":     "cmrfet98c000oufvgju7urc3c",
  "STEFAN":      "cmrfetaus000xufvgkrmmy3qx",
  "CID":         "cmrfetdx1001fufvg3nxri93z",
  "THIAGO":      "cmrfet5iz0003ufvgp58hh1wf",
  "EDSON":       "cmrfet73p000cufvgqa3b4do6",
  "GUILHERME":   "cmrfethjx0020ufvg8mvzztt8",
  "ALÊ":         "cmrfet9qk000rufvgfp58ax8j",
  "BONA":        "cmrfetef9001iufvgj89nf9p9",
  "ALINE":       "cmrfetbvb0013ufvgw3qbftz7",
  "SAMUEL":      "cmrfet87r000iufvgb1i0vy3h",
  "DU":          "cmrfet6lj0009ufvgg5l9r40j",
  "CARLOS":      "cmrfet8q1000lufvg3xt6srnq",
  "LUKINHA":     "cmrfetcvx0019ufvgitmt42fb",
  "MARCOS":      "cmrfeth1m001xufvgah79poiy",
  "MATHEUS":     "cmrfeti260023ufvgog85bc4d",
}

const rawSchedule = `02/2026	MURILO
02/2026	JOAO GABRIEL
02/2026	JANICE
02/2026	ULYSSES
02/2026	GUSTAVO
02/2026	LUIZ
02/2026	GIULIA
02/2026	CHINA
02/2026	EZEQUIAS
02/2026	CHRISTIAN
02/2026	NICELIO
02/2026	EVERTON
02/2026	STEFAN
02/2026	CID
02/2026	THIAGO
02/2026	EDSON
02/2026	GUILHERME
02/2026	ALÊ
02/2026	BONA
02/2026	ALINE
02/2026	SAMUEL
02/2026	DU
02/2026	CARLOS
02/2026	LUKINHA
02/2026	MURILO
02/2026	CID
02/2026	STEFAN
02/2026	EDSON
02/2026	THIAGO
02/2026	ALÊ
02/2026	GUILHERME
02/2026	ALINE
02/2026	BONA
02/2026	DU
02/2026	SAMUEL
02/2026	LUKINHA
02/2026	JOAO GABRIEL
02/2026	ULYSSES
02/2026	JANICE
02/2026	LUIZ
02/2026	GUSTAVO
02/2026	CHINA
02/2026	GIULIA
02/2026	CHRISTIAN
02/2026	EVERTON
02/2026	EZEQUIAS
02/2026	NICELIO
02/2026	CARLOS
02/2026	MURILO
02/2026	ULYSSES
02/2026	JOAO GABRIEL
02/2026	LUIZ
02/2026	JANICE
02/2026	CHINA
02/2026	GUSTAVO
02/2026	CHRISTIAN
02/2026	GIULIA
02/2026	EVERTON
02/2026	EZEQUIAS
02/2026	CARLOS
02/2026	CID
02/2026	EDSON
02/2026	STEFAN
02/2026	ALÊ
02/2026	THIAGO
02/2026	ALINE
02/2026	GUILHERME
02/2026	DU
02/2026	BONA
02/2026	LUKINHA
02/2026	SAMUEL
02/2026	NICELIO
03/2026	MURILO
03/2026	EDSON
03/2026	CID
03/2026	ALÊ
03/2026	STEFAN
03/2026	ALINE
03/2026	THIAGO
03/2026	DU
03/2026	GUILHERME
03/2026	LUKINHA
03/2026	BONA
03/2026	NICELIO
03/2026	ULYSSES
03/2026	LUIZ
03/2026	JOAO GABRIEL
03/2026	CHINA
03/2026	JANICE
03/2026	CHRISTIAN
03/2026	GUSTAVO
03/2026	EVERTON
03/2026	GIULIA
03/2026	CARLOS
03/2026	EZEQUIAS
03/2026	SAMUEL
03/2026	MURILO
03/2026	LUIZ
03/2026	ULYSSES
03/2026	CHINA
03/2026	JOAO GABRIEL
03/2026	CHRISTIAN
03/2026	JANICE
03/2026	EVERTON
03/2026	GUSTAVO
03/2026	CARLOS
03/2026	GIULIA
03/2026	SAMUEL
03/2026	EDSON
03/2026	ALÊ
03/2026	CID
03/2026	ALINE
03/2026	STEFAN
03/2026	DU
03/2026	THIAGO
03/2026	LUKINHA
03/2026	GUILHERME
03/2026	NICELIO
03/2026	BONA
03/2026	EZEQUIAS
03/2026	MURILO
03/2026	ALÊ
03/2026	EDSON
03/2026	ALINE
03/2026	CID
03/2026	DU
03/2026	STEFAN
03/2026	LUKINHA
03/2026	THIAGO
03/2026	NICELIO
03/2026	GUILHERME
03/2026	EZEQUIAS
03/2026	LUIZ
03/2026	CHINA
03/2026	ULYSSES
03/2026	CHRISTIAN
03/2026	JOAO GABRIEL
03/2026	EVERTON
03/2026	JANICE
03/2026	CARLOS
03/2026	GUSTAVO
03/2026	SAMUEL
03/2026	GIULIA
03/2026	BONA
04/2026	MURILO
04/2026	CHINA
04/2026	LUIZ
04/2026	CHRISTIAN
04/2026	ULYSSES
04/2026	EVERTON
04/2026	JOAO GABRIEL
04/2026	CARLOS
04/2026	JANICE
04/2026	SAMUEL
04/2026	GUSTAVO
04/2026	BONA
04/2026	ALÊ
04/2026	ALINE
04/2026	EDSON
04/2026	DU
04/2026	CID
04/2026	LUKINHA
04/2026	STEFAN
04/2026	NICELIO
04/2026	THIAGO
04/2026	EZEQUIAS
04/2026	DU
04/2026	CHINA
04/2026	GUILHERME
04/2026	GIULIA
04/2026	MURILO
04/2026	ALINE
04/2026	ALÊ
04/2026	DU
04/2026	EDSON
04/2026	LUKINHA
04/2026	CID
04/2026	NICELIO
04/2026	STEFAN
04/2026	EZEQUIAS
04/2026	THIAGO
04/2026	GIULIA
04/2026	CHINA
04/2026	CHRISTIAN
04/2026	LUIZ
04/2026	EVERTON
04/2026	ULYSSES
04/2026	CARLOS
04/2026	JOAO GABRIEL
04/2026	SAMUEL
04/2026	JANICE
04/2026	BONA
04/2026	GUSTAVO
04/2026	GUILHERME
04/2026	MURILO
04/2026	CHRISTIAN
04/2026	CHINA
04/2026	EVERTON
04/2026	LUIZ
04/2026	CARLOS
04/2026	ULYSSES
04/2026	SAMUEL
04/2026	JOAO GABRIEL
04/2026	BONA
04/2026	JANICE
04/2026	GUILHERME
04/2026	ALINE
04/2026	DU
04/2026	ALÊ
04/2026	LUKINHA
04/2026	EDSON
04/2026	NICELIO
04/2026	CID
04/2026	EZEQUIAS
04/2026	STEFAN
04/2026	GIULIA
04/2026	THIAGO
04/2026	GUSTAVO
05/2026	MURILO
05/2026	DU
05/2026	ALINE
05/2026	LUKINHA
05/2026	ALÊ
05/2026	NICELIO
05/2026	EDSON
05/2026	EZEQUIAS
05/2026	CID
05/2026	GIULIA
05/2026	STEFAN
05/2026	GUSTAVO
05/2026	CHRISTIAN
05/2026	EVERTON
05/2026	CHINA
05/2026	CARLOS
05/2026	LUIZ
05/2026	SAMUEL
05/2026	ULYSSES
05/2026	BONA
05/2026	JOAO GABRIEL
05/2026	GUILHERME
05/2026	JANICE
05/2026	THIAGO
05/2026	MURILO
05/2026	EVERTON
05/2026	CHRISTIAN
05/2026	CARLOS
05/2026	CHINA
05/2026	SAMUEL
05/2026	LUIZ
05/2026	BONA
05/2026	ULYSSES
05/2026	MARCOS
05/2026	JOAO GABRIEL
05/2026	THIAGO
05/2026	DU
05/2026	LUKINHA
05/2026	ALINE
05/2026	NICELIO
05/2026	ALÊ
05/2026	EZEQUIAS
05/2026	EDSON
05/2026	GIULIA
05/2026	CID
05/2026	GUSTAVO
05/2026	STEFAN
05/2026	JANICE
05/2026	MURILO
05/2026	LUKINHA
05/2026	DU
05/2026	NICELIO
05/2026	ALINE
05/2026	EZEQUIAS
05/2026	ALÊ
05/2026	GIULIA
05/2026	EDSON
05/2026	GUSTAVO
05/2026	CID
05/2026	JANICE
05/2026	EVERTON
05/2026	CARLOS
05/2026	CHRISTIAN
05/2026	SAMUEL
05/2026	CHINA
05/2026	BONA
05/2026	LUIZ
05/2026	MARCOS
05/2026	ULYSSES
05/2026	THIAGO
05/2026	JOAO GABRIEL
05/2026	STEFAN
06/2026	MURILO
06/2026	CARLOS
06/2026	EVERTON
06/2026	SAMUEL
06/2026	CHRISTIAN
06/2026	BONA
06/2026	CHINA
06/2026	MARCOS
06/2026	LUIZ
06/2026	THIAGO
06/2026	ULYSSES
06/2026	STEFAN
06/2026	LUKINHA
06/2026	NICELIO
06/2026	DU
06/2026	EZEQUIAS
06/2026	ALINE
06/2026	GIULIA
06/2026	ALÊ
06/2026	GUSTAVO
06/2026	EDSON
06/2026	JANICE
06/2026	CID
06/2026	JOAO GABRIEL
06/2026	MURILO
06/2026	NICELIO
06/2026	LUKINHA
06/2026	EZEQUIAS
06/2026	DU
06/2026	GIULIA
06/2026	ALINE
06/2026	GUSTAVO
06/2026	ALÊ
06/2026	JANICE
06/2026	EDSON
06/2026	JOAO GABRIEL
06/2026	CARLOS
06/2026	SAMUEL
06/2026	EVERTON
06/2026	BONA
06/2026	CHRISTIAN
06/2026	MARCOS
06/2026	CHINA
06/2026	THIAGO
06/2026	LUIZ
06/2026	STEFAN
06/2026	ULYSSES
06/2026	CID
06/2026	MURILO
06/2026	SAMUEL
06/2026	CARLOS
06/2026	BONA
06/2026	EVERTON
06/2026	MARCOS
06/2026	CHRISTIAN
06/2026	THIAGO
06/2026	CHINA
06/2026	STEFAN
06/2026	LUIZ
06/2026	CID
06/2026	NICELIO
06/2026	EZEQUIAS
06/2026	LUKINHA
06/2026	GIULIA
06/2026	DU
06/2026	GUSTAVO
06/2026	ALINE
06/2026	JANICE
06/2026	ALÊ
06/2026	JOAO GABRIEL
06/2026	EDSON
06/2026	ULYSSES
07/2026	MURILO
07/2026	EZEQUIAS
07/2026	NICELIO
07/2026	MATHEUS
07/2026	LUKINHA
07/2026	GUSTAVO
07/2026	DU
07/2026	JANICE
07/2026	ALINE
07/2026	JOAO GABRIEL
07/2026	ALÊ
07/2026	ULYSSES
07/2026	SAMUEL
07/2026	BONA
07/2026	CARLOS
07/2026	MARCOS
07/2026	EVERTON
07/2026	THIAGO
07/2026	CHRISTIAN
07/2026	STEFAN
07/2026	CHINA
07/2026	CID
07/2026	LUIZ
07/2026	EDSON
07/2026	MURILO
07/2026	BONA
07/2026	SAMUEL
07/2026	MARCOS
07/2026	CARLOS
07/2026	THIAGO
07/2026	EVERTON
07/2026	STEFAN
07/2026	CHRISTIAN
07/2026	CID
07/2026	CHINA
07/2026	EDSON
07/2026	EZEQUIAS
07/2026	MATHEUS
07/2026	NICELIO
07/2026	GUSTAVO
07/2026	LUKINHA
07/2026	JANICE
07/2026	DU
07/2026	JOAO GABRIEL
07/2026	ALINE
07/2026	ULYSSES
07/2026	ALÊ
07/2026	LUIZ
07/2026	MURILO
07/2026	MATHEUS
07/2026	EZEQUIAS
07/2026	GUSTAVO
07/2026	NICELIO
07/2026	JANICE
07/2026	LUKINHA
07/2026	JOAO GABRIEL
07/2026	DU
07/2026	ULYSSES
07/2026	ALINE
07/2026	LUIZ
07/2026	BONA
07/2026	MARCOS
07/2026	SAMUEL
07/2026	THIAGO
07/2026	CARLOS
07/2026	STEFAN
07/2026	EVERTON
07/2026	CID
07/2026	CHRISTIAN
07/2026	EDSON
07/2026	CHINA
07/2026	ALÊ
08/2026	MURILO
08/2026	MARCOS
08/2026	BONA
08/2026	THIAGO
08/2026	SAMUEL
08/2026	STEFAN
08/2026	CARLOS
08/2026	CID
08/2026	EVERTON
08/2026	EDSON
08/2026	CHRISTIAN
08/2026	ALÊ
08/2026	MATHEUS
08/2026	GUSTAVO
08/2026	EZEQUIAS
08/2026	JANICE
08/2026	NICELIO
08/2026	JOAO GABRIEL
08/2026	LUKINHA
08/2026	ULYSSES
08/2026	DU
08/2026	LUIZ
08/2026	ALINE
08/2026	CHINA
08/2026	MURILO
08/2026	GUSTAVO
08/2026	MATHEUS
08/2026	JANICE
08/2026	EZEQUIAS
08/2026	JOAO GABRIEL
08/2026	NICELIO
08/2026	ULYSSES
08/2026	LUKINHA
08/2026	LUIZ
08/2026	DU
08/2026	CHINA
08/2026	MARCOS
08/2026	THIAGO
08/2026	BONA
08/2026	STEFAN
08/2026	SAMUEL
08/2026	CID
08/2026	CARLOS
08/2026	EDSON
08/2026	EVERTON
08/2026	ALÊ
08/2026	CHRISTIAN
08/2026	ALINE
08/2026	MURILO
08/2026	THIAGO
08/2026	MARCOS
08/2026	STEFAN
08/2026	BONA
08/2026	CID
08/2026	SAMUEL
08/2026	EDSON
08/2026	CARLOS
08/2026	ALÊ
08/2026	EVERTON
08/2026	ALINE
08/2026	GUSTAVO
08/2026	JANICE
08/2026	MATHEUS
08/2026	JOAO GABRIEL
08/2026	EZEQUIAS
08/2026	ULYSSES
08/2026	NICELIO
08/2026	LUIZ
08/2026	LUKINHA
08/2026	CHINA
08/2026	DU
08/2026	CHRISTIAN
09/2026	MURILO
09/2026	JANICE
09/2026	GUSTAVO
09/2026	JOAO GABRIEL
09/2026	MATHEUS
09/2026	ULYSSES
09/2026	EZEQUIAS
09/2026	LUIZ
09/2026	NICELIO
09/2026	CHINA
09/2026	LUKINHA
09/2026	CHRISTIAN
09/2026	THIAGO
09/2026	STEFAN
09/2026	MARCOS
09/2026	CID
09/2026	BONA
09/2026	EDSON
09/2026	SAMUEL
09/2026	ALÊ
09/2026	CARLOS
09/2026	ALINE
09/2026	EVERTON
09/2026	DU
09/2026	MURILO
09/2026	STEFAN
09/2026	THIAGO
09/2026	CID
09/2026	MARCOS
09/2026	EDSON
09/2026	BONA
09/2026	ALÊ
09/2026	SAMUEL
09/2026	ALINE
09/2026	CARLOS
09/2026	DU
09/2026	JANICE
09/2026	JOAO GABRIEL
09/2026	GUSTAVO
09/2026	ULYSSES
09/2026	MATHEUS
09/2026	LUIZ
09/2026	EZEQUIAS
09/2026	CHINA
09/2026	NICELIO
09/2026	CHRISTIAN
09/2026	LUKINHA
09/2026	EVERTON`

function parseSchedule(): Array<{ month: string; home: string; away: string }> {
  const lines = rawSchedule.trim().split("\n")
  const pairs: Array<{ month: string; home: string; away: string }> = []

  let currentMonth = ""
  const currentMonthPlayers: string[] = []

  for (const line of lines) {
    const parts = line.split("\t")
    const month = parts[0].trim()
    const player = parts[1].trim()

    if (month !== currentMonth) {
      if (currentMonthPlayers.length > 0) {
        for (let i = 0; i < currentMonthPlayers.length - 1; i += 2) {
          pairs.push({
            month: currentMonth,
            home: currentMonthPlayers[i],
            away: currentMonthPlayers[i + 1],
          })
        }
      }
      currentMonth = month
      currentMonthPlayers.length = 0
    }
    currentMonthPlayers.push(player)
  }

  if (currentMonthPlayers.length > 0) {
    for (let i = 0; i < currentMonthPlayers.length - 1; i += 2) {
      pairs.push({
        month: currentMonth,
        home: currentMonthPlayers[i],
        away: currentMonthPlayers[i + 1],
      })
    }
  }

  return pairs
}

function getLastDayOfMonth(monthStr: string): Date {
  const [month, year] = monthStr.split("/").map(Number)
  return new Date(year, month, 0)
}

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim()
}

async function main() {
  const schedule = parseSchedule()
  console.log(`Parsed ${schedule.length} match pairs from schedule`)

  const allMembers = await prisma.tournamentMember.findMany({
    where: { tournamentId: TOURNAMENT_ID, status: "accepted" },
    select: { userId: true, user: { select: { name: true } } },
  })

  const nameToId = new Map<string, string>()
  for (const m of allMembers) {
    nameToId.set(normalize(m.user.name), m.userId)
  }

  const existingMatches = await prisma.match.findMany({
    where: { tournamentId: TOURNAMENT_ID },
    include: {
      homePlayer: { select: { name: true } },
      awayPlayer: { select: { name: true } },
    },
  })

  const matchKeyMap = new Map<string, typeof existingMatches[0]>()
  for (const m of existingMatches) {
    const h = normalize(m.homePlayer.name)
    const a = normalize(m.awayPlayer.name)
    matchKeyMap.set(`${h}|||${a}`, m)
    matchKeyMap.set(`${a}|||${h}`, m)
  }

  const pastMonths = ["02/2026", "03/2026", "04/2026", "05/2026", "06/2026"]
  const futureMonths = ["08/2026", "09/2026"]

  const usedMatchIds = new Set<string>()

  let updated = 0
  let created = 0
  let notFound = 0
  let scheduledKept = 0

  for (const pair of schedule) {
    const homeId = nameToId.get(normalize(pair.home))
    const awayId = nameToId.get(normalize(pair.away))

    if (!homeId || !awayId) {
      console.log(`  SKIP: Unknown player(s) in ${pair.home} vs ${pair.away} (${pair.month})`)
      notFound++
      continue
    }

    const key = `${normalize(pair.home)}|||${normalize(pair.away)}`
    const existing = matchKeyMap.get(key)

    if (existing && !usedMatchIds.has(existing.id)) {
      usedMatchIds.add(existing.id)

      if (pastMonths.includes(pair.month)) {
        if (existing.status === "finished" || existing.status === "wo") {
          const lastDay = getLastDayOfMonth(pair.month)
          await prisma.match.update({
            where: { id: existing.id },
            data: {
              scheduledAt: lastDay,
              month: pair.month,
            },
          })
          updated++
        } else {
          await prisma.match.update({
            where: { id: existing.id },
            data: {
              scheduledAt: null,
              status: "pending_scheduling",
              month: pair.month,
              round: `Adiado de ${pair.month}`,
            },
          })
          updated++
        }
      } else if (pair.month === "07/2026") {
        if (existing.status === "scheduled") {
          await prisma.match.update({
            where: { id: existing.id },
            data: { month: pair.month },
          })
          scheduledKept++
        } else {
          await prisma.match.update({
            where: { id: existing.id },
            data: { month: pair.month },
          })
          updated++
        }
      } else if (futureMonths.includes(pair.month)) {
        await prisma.match.update({
          where: { id: existing.id },
          data: { month: pair.month },
        })
        updated++
      }
    } else {
      await prisma.match.create({
        data: {
          tournamentId: TOURNAMENT_ID,
          homePlayerId: homeId,
          awayPlayerId: awayId,
          status: "pending_scheduling",
          scheduledAt: null,
          month: pair.month,
          phase: "ranking",
          duration: 120,
        },
      })
      created++
    }
  }

  console.log(`\n=== RESULTS ===`)
  console.log(`Updated (dates/month): ${updated}`)
  console.log(`Kept scheduled (Jul existing): ${scheduledKept}`)
  console.log(`Created new: ${created}`)
  console.log(`Not found/skipped: ${notFound}`)
  console.log(`Total pairs processed: ${schedule.length}`)

  // Fix July finished matches without scheduledAt
  const julyFix = await prisma.$executeRaw`
    UPDATE "Match"
    SET "scheduledAt" = '2026-07-01T06:00:00.000Z'
    WHERE "tournamentId" = ${TOURNAMENT_ID}
    AND "status" IN ('finished', 'wo')
    AND "month" = '07/2026'
    AND "scheduledAt" IS NULL
  `
  console.log(`\nJuly date fix: ${julyFix} matches updated`)

  await prisma.$disconnect()
}

main().catch(e => {
  console.error(e)
  process.exit(1)
})

import prisma from "@/lib/prisma"

type TeamSeed = {
  id: string
  name: string
  seed: number
  points?: number
  groupId?: string | null
  groupName?: string | null
}

type BracketInput =
  | (TeamSeed & { kind: "team" })
  | { kind: "source"; label: string; round: number; position: number }
  | { kind: "empty" }

export async function generateCategoryOpeningPhase(categoryId: string) {
  const category = await prisma.tournamentCategory.findUnique({
    where: { id: categoryId },
    include: {
      teams: { where: { status: { in: ["complete", "confirmed"] } }, orderBy: [{ createdAt: "asc" }] },
      groups: { select: { id: true } },
      matches: { select: { id: true } },
    },
  })

  if (!category) return { error: "Categoria não encontrada", status: 404 }
  if (category.groups.length || category.matches.length) {
    return { error: "A fase inicial desta categoria já foi gerada", status: 400 }
  }
  if (category.teams.length < 2) {
    return { error: "Cadastre pelo menos 2 equipes completas para gerar a fase", status: 400 }
  }

  const teams = shuffle(category.teams)
  const hasGroupPhase = category.format === "group_ranking_knockout" || category.format === "group_knockout"

  if (hasGroupPhase) {
    const groupSize = category.groupSize ?? 4
    const groupCount = Math.max(1, Math.ceil(teams.length / groupSize))
    const groups = Array.from({ length: groupCount }, (_, index) => ({
      name: `Grupo ${String.fromCharCode(65 + index)}`,
      position: index + 1,
      teams: [] as typeof teams,
    }))

    teams.forEach((team, index) => {
      groups[index % groupCount].teams.push(team)
    })

    for (const groupConfig of groups) {
      const group = await prisma.categoryGroup.create({
        data: {
          categoryId,
          name: groupConfig.name,
          position: groupConfig.position,
          status: "drawn",
        },
      })

      for (const [index, team] of groupConfig.teams.entries()) {
        await prisma.categoryGroupEntry.create({
          data: { groupId: group.id, teamId: team.id, position: index + 1 },
        })
        await upsertStanding(categoryId, team.id, group.id)
      }

      await createRoundRobinMatches(categoryId, groupConfig.teams, "group", group.id)
    }
  } else if (category.format === "ranking_knockout") {
    for (const team of teams) {
      await upsertStanding(categoryId, team.id, null)
    }
    await createRoundRobinMatches(categoryId, teams, "ranking", null)
  } else if (category.format === "double_elimination") {
    const seededTeams = teams.map((team, index) => ({ id: team.id, name: team.name, seed: index + 1 }))
    await createBracket(categoryId, seededTeams, "main", "winners")
  }

  await prisma.tournamentCategory.update({
    where: { id: categoryId },
    data: { status: "in_progress" },
  })

  return { state: await getCategoryState(categoryId), status: 200 }
}

export async function recalculateCategoryStandings(categoryId: string) {
  const category = await prisma.tournamentCategory.findUnique({
    where: { id: categoryId },
    include: {
      matches: {
        where: { phase: { in: ["group", "ranking"] }, status: { in: ["finished", "wo"] } },
        include: { sets: true },
      },
      teams: true,
      groups: { include: { entries: true } },
    },
  })

  if (!category) return []

  const rows = new Map<string, {
    teamId: string
    groupId: string | null
    points: number
    matchesPlayed: number
    wins: number
    losses: number
    setsWon: number
    setsLost: number
    pointsWon: number
    pointsLost: number
  }>()

  const groupByTeam = new Map<string, string | null>()
  category.groups.forEach((group) => {
    group.entries.forEach((entry) => groupByTeam.set(entry.teamId, group.id))
  })
  category.teams.forEach((team) => {
    rows.set(team.id, {
      teamId: team.id,
      groupId: groupByTeam.get(team.id) ?? null,
      points: 0,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      pointsWon: 0,
      pointsLost: 0,
    })
  })

  for (const match of category.matches) {
    const home = rows.get(match.homeTeamId)
    const away = rows.get(match.awayTeamId)
    if (!home || !away) continue

    const winnerId = match.winnerTeamId
    const homeWon = winnerId === match.homeTeamId
    const awayWon = winnerId === match.awayTeamId
    const setTotals = summarizeSets(match.sets, homeWon, awayWon)

    home.matchesPlayed += 1
    away.matchesPlayed += 1
    home.wins += homeWon ? 1 : 0
    home.losses += awayWon ? 1 : 0
    away.wins += awayWon ? 1 : 0
    away.losses += homeWon ? 1 : 0
    home.points += homeWon ? 3 : 0
    away.points += awayWon ? 3 : 0
    home.setsWon += setTotals.homeSetsWon
    home.setsLost += setTotals.awaySetsWon
    away.setsWon += setTotals.awaySetsWon
    away.setsLost += setTotals.homeSetsWon
    home.pointsWon += setTotals.homePoints
    home.pointsLost += setTotals.awayPoints
    away.pointsWon += setTotals.awayPoints
    away.pointsLost += setTotals.homePoints
  }

  const sorted = Array.from(rows.values()).sort(compareStandingRows)

  await prisma.$transaction(
    sorted.map((row, index) =>
      prisma.categoryStanding.upsert({
        where: { categoryId_teamId_series: { categoryId, teamId: row.teamId, series: "main" } },
        update: { ...row, position: index + 1, series: "main" },
        create: { categoryId, ...row, position: index + 1, series: "main" },
      })
    )
  )

  return prisma.categoryStanding.findMany({
    where: { categoryId },
    orderBy: [{ series: "asc" }, { position: "asc" }],
    include: { team: true },
  })
}

export async function lockCategoryBracket(categoryId: string) {
  const category = await prisma.tournamentCategory.findUnique({
    where: { id: categoryId },
    include: {
      bracketMatches: { select: { id: true } },
      matches: { where: { phase: { in: ["group", "ranking"] } }, select: { status: true } },
    },
  })

  if (!category) return { error: "Categoria não encontrada", status: 404 }
  if (category.bracketMatches.length) return { error: "O mata-mata desta categoria já foi gerado", status: 400 }
  if (category.format === "double_elimination") return { error: "A dupla eliminatória já gera chave inicial", status: 400 }
  if (category.matches.some((match) => !["finished", "wo", "cancelled"].includes(match.status))) {
    return { error: "Finalize os jogos da fase inicial antes de travar o mata-mata", status: 400 }
  }

  await recalculateCategoryStandings(categoryId)
  const standings = await prisma.categoryStanding.findMany({
    where: { categoryId, series: "main" },
    orderBy: [{ position: "asc" }],
    include: { team: true },
  })

  const goldTotal = category.goldQualifiersTotal ?? standings.length
  const goldTeams = standings.slice(0, goldTotal).map((row, index) => ({
    id: row.teamId,
    name: row.team.name,
    seed: index + 1,
    points: row.points,
    groupId: row.groupId,
  }))

  if (goldTeams.length < 2) return { error: "Não há classificados suficientes para a Série Ouro", status: 400 }

  await createBracket(categoryId, goldTeams, "gold", "main")

  if (category.enableSilverSeries) {
    const silverStart = goldTotal
    const silverTotal = category.silverQualifiersTotal ?? Math.max(0, standings.length - silverStart)
    const silverTeams = standings.slice(silverStart, silverStart + silverTotal).map((row, index) => ({
      id: row.teamId,
      name: row.team.name,
      seed: index + 1,
      points: row.points,
      groupId: row.groupId,
    }))
    if (silverTeams.length >= 2) {
      await createBracket(categoryId, silverTeams, "silver", "main")
    }
  }

  await prisma.tournamentCategory.update({
    where: { id: categoryId },
    data: { status: "knockout_locked" },
  })

  return { state: await getCategoryState(categoryId), status: 200 }
}

export async function recordCategoryMatchResult(matchId: string, input: {
  winnerTeamId: string
  sets?: { homePoints: number; awayPoints: number; isTiebreak?: boolean }[]
  endReason?: string
  endPhotoUrl?: string | null
  refereeId?: string | null
}) {
  const match = await prisma.categoryMatch.findUnique({
    where: { id: matchId },
    include: { bracketMatch: true },
  })
  if (!match) return { error: "Jogo não encontrado", status: 404 }
  if (![match.homeTeamId, match.awayTeamId].includes(input.winnerTeamId)) {
    return { error: "Vencedor inválido para este jogo", status: 400 }
  }

  const sets = input.sets ?? []
  const summary = summarizeSets(
    sets.map((set, index) => ({ ...set, setNumber: index + 1 })),
    input.winnerTeamId === match.homeTeamId,
    input.winnerTeamId === match.awayTeamId
  )

  await prisma.$transaction([
    prisma.categorySet.deleteMany({ where: { matchId } }),
    ...sets.map((set, index) =>
      prisma.categorySet.create({
        data: {
          matchId,
          setNumber: index + 1,
          homePoints: Number(set.homePoints),
          awayPoints: Number(set.awayPoints),
          isTiebreak: Boolean(set.isTiebreak),
        },
      })
    ),
    prisma.categoryMatch.update({
      where: { id: matchId },
      data: {
        status: input.endReason === "wo" ? "wo" : "finished",
        winnerTeamId: input.winnerTeamId,
        endReason: input.endReason ?? null,
        homeScore: summary.homeSetsWon,
        awayScore: summary.awaySetsWon,
        endPhotoUrl: input.endPhotoUrl ?? undefined,
        refereeId: input.refereeId ?? undefined,
        finishedAt: new Date(),
      },
    }),
  ])

  if (match.phase === "group" || match.phase === "ranking") {
    await recalculateCategoryStandings(match.categoryId)
  }

  if (match.bracketMatch) {
    await advanceCategoryBracket(match.bracketMatch.id, input.winnerTeamId)
  }

  return { match: await prisma.categoryMatch.findUnique({ where: { id: matchId }, include: { sets: true } }), status: 200 }
}

export async function getCategoryState(categoryId: string) {
  await recalculateCategoryStandings(categoryId)

  return prisma.tournamentCategory.findUnique({
    where: { id: categoryId },
    include: {
      teams: { include: { members: { include: { user: true } } }, orderBy: [{ name: "asc" }] },
      groups: {
        orderBy: [{ position: "asc" }],
        include: { entries: { include: { team: true }, orderBy: [{ position: "asc" }] } },
      },
      standings: { include: { team: true }, orderBy: [{ series: "asc" }, { position: "asc" }] },
      matches: {
        include: { homeTeam: true, awayTeam: true, sets: true },
        orderBy: [{ phase: "asc" }, { groupId: "asc" }, { position: "asc" }],
      },
      bracketMatches: {
        include: { homeTeam: true, awayTeam: true, winnerTeam: true, match: true },
        orderBy: [{ series: "asc" }, { bracketSide: "asc" }, { round: "asc" }, { position: "asc" }],
      },
    },
  })
}

async function createRoundRobinMatches(
  categoryId: string,
  teams: { id: string }[],
  phase: "group" | "ranking",
  groupId: string | null
) {
  let position = 1
  for (let homeIndex = 0; homeIndex < teams.length; homeIndex++) {
    for (let awayIndex = homeIndex + 1; awayIndex < teams.length; awayIndex++) {
      await prisma.categoryMatch.create({
        data: {
          categoryId,
          homeTeamId: teams[homeIndex].id,
          awayTeamId: teams[awayIndex].id,
          groupId,
          phase,
          series: "main",
          round: groupId ? "Fase de grupos" : "Ranking",
          position,
        },
      })
      position += 1
    }
  }
}

async function createBracket(categoryId: string, teams: TeamSeed[], series: string, bracketSide: string) {
  const totalSlots = nextPowerOfTwo(teams.length)
  const totalRounds = Math.log2(totalSlots)
  const seedOrder = generateSeedingOrder(totalSlots)
  let inputs: BracketInput[] = seedOrder.map((seed) => {
    const team = teams[seed - 1]
    return team ? { ...team, kind: "team" as const } : { kind: "empty" as const }
  })

  for (let round = 1; round <= totalRounds; round++) {
    const nextInputs: BracketInput[] = []
    const roundName = getRoundName(round, totalRounds)

    for (let index = 0; index < inputs.length; index += 2) {
      const position = index / 2 + 1
      const home = inputs[index]
      const away = inputs[index + 1] ?? { kind: "empty" as const }
      const nextRound = round < totalRounds ? round + 1 : null
      const nextPosition = round < totalRounds ? Math.ceil(position / 2) : null
      const nextSlot = round < totalRounds ? (position % 2 === 1 ? "home" : "away") : null
      const homeTeam = home.kind === "team" ? home : null
      const awayTeam = away.kind === "team" ? away : null
      const homeSourceLabel = home.kind === "source" ? home.label : null
      const awaySourceLabel = away.kind === "source" ? away.label : null
      const hasHome = home.kind !== "empty"
      const hasAway = away.kind !== "empty"
      let winnerTeamId: string | null = null
      let status = "waiting"
      let winnerInput: BracketInput = {
        kind: "source",
        label: `Vencedor ${roundName} ${position}`,
        round,
        position,
      }

      if (homeTeam && awayTeam) {
        status = "ready"
      } else if (homeTeam && !hasAway) {
        status = "bye"
        winnerTeamId = homeTeam.id
        winnerInput = homeTeam
      } else if (!hasHome && awayTeam) {
        status = "bye"
        winnerTeamId = awayTeam.id
        winnerInput = awayTeam
      }

      const bracket = await prisma.categoryBracketMatch.create({
        data: {
          categoryId,
          series,
          bracketSide,
          round,
          position,
          roundName,
          status,
          homeSeed: homeTeam?.seed ?? null,
          awaySeed: awayTeam?.seed ?? null,
          homeTeamId: homeTeam?.id ?? null,
          awayTeamId: awayTeam?.id ?? null,
          winnerTeamId,
          homeSourceLabel,
          awaySourceLabel,
          winnerNextRound: nextRound,
          winnerNextPosition: nextPosition,
          winnerNextSlot: nextSlot,
        },
      })

      if (status === "ready") await createCategoryKnockoutMatch(bracket.id)
      nextInputs.push(winnerInput)
    }

    inputs = nextInputs
  }
}

async function advanceCategoryBracket(bracketMatchId: string, winnerTeamId: string) {
  const bracket = await prisma.categoryBracketMatch.findUnique({ where: { id: bracketMatchId } })
  if (!bracket) return

  const winnerSeed = winnerTeamId === bracket.homeTeamId ? bracket.homeSeed : bracket.awaySeed
  await prisma.categoryBracketMatch.update({
    where: { id: bracket.id },
    data: { status: "completed", winnerTeamId },
  })

  if (!bracket.winnerNextRound || !bracket.winnerNextPosition || !bracket.winnerNextSlot) {
    await prisma.tournamentCategory.update({
      where: { id: bracket.categoryId },
      data: { status: "finished" },
    })
    return
  }

  const next = await prisma.categoryBracketMatch.findFirst({
    where: {
      categoryId: bracket.categoryId,
      series: bracket.series,
      bracketSide: bracket.bracketSide,
      round: bracket.winnerNextRound,
      position: bracket.winnerNextPosition,
    },
  })
  if (!next) return

  const data = bracket.winnerNextSlot === "home"
    ? { homeTeamId: winnerTeamId, homeSeed: winnerSeed, homeSourceLabel: null }
    : { awayTeamId: winnerTeamId, awaySeed: winnerSeed, awaySourceLabel: null }

  const updated = await prisma.categoryBracketMatch.update({ where: { id: next.id }, data })
  if (updated.homeTeamId && updated.awayTeamId && updated.status !== "completed") {
    await createCategoryKnockoutMatch(updated.id)
  }
}

async function createCategoryKnockoutMatch(bracketMatchId: string) {
  const bracket = await prisma.categoryBracketMatch.findUnique({ where: { id: bracketMatchId } })
  if (!bracket?.homeTeamId || !bracket.awayTeamId || bracket.matchId) return

  const match = await prisma.categoryMatch.create({
    data: {
      categoryId: bracket.categoryId,
      homeTeamId: bracket.homeTeamId,
      awayTeamId: bracket.awayTeamId,
      phase: bracket.bracketSide === "winners" ? "double_elimination" : "knockout",
      series: bracket.series,
      bracketSide: bracket.bracketSide,
      round: bracket.roundName,
      position: bracket.position,
    },
  })

  await prisma.categoryBracketMatch.update({
    where: { id: bracketMatchId },
    data: { matchId: match.id, status: "ready" },
  })
}

async function upsertStanding(categoryId: string, teamId: string, groupId: string | null) {
  await prisma.categoryStanding.upsert({
    where: { categoryId_teamId_series: { categoryId, teamId, series: "main" } },
    update: { groupId },
    create: { categoryId, teamId, groupId, position: 999, series: "main" },
  })
}

function summarizeSets(
  sets: { homePoints: number; awayPoints: number }[],
  homeWon: boolean,
  awayWon: boolean
) {
  const totals = sets.reduce<{
    homePoints: number
    awayPoints: number
    homeSetsWon: number
    awaySetsWon: number
  }>(
    (acc, set) => {
      acc.homePoints += Number(set.homePoints)
      acc.awayPoints += Number(set.awayPoints)
      if (Number(set.homePoints) > Number(set.awayPoints)) acc.homeSetsWon += 1
      if (Number(set.awayPoints) > Number(set.homePoints)) acc.awaySetsWon += 1
      return acc
    },
    { homePoints: 0, awayPoints: 0, homeSetsWon: 0, awaySetsWon: 0 }
  )

  if (sets.length === 0) {
    totals.homeSetsWon = homeWon ? 1 : 0
    totals.awaySetsWon = awayWon ? 1 : 0
  }

  return totals
}

function compareStandingRows(a: { points: number; wins: number; setsWon: number; setsLost: number; pointsWon: number; pointsLost: number }, b: typeof a) {
  return (
    b.points - a.points ||
    b.wins - a.wins ||
    (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost) ||
    (b.pointsWon - b.pointsLost) - (a.pointsWon - a.pointsLost) ||
    b.pointsWon - a.pointsWon
  )
}

function nextPowerOfTwo(value: number) {
  return Math.pow(2, Math.ceil(Math.log2(value)))
}

function generateSeedingOrder(totalSlots: number): number[] {
  if (totalSlots <= 1) return [1]
  const previous = generateSeedingOrder(totalSlots / 2)
  return previous.flatMap((seed) => [seed, totalSlots + 1 - seed])
}

function getRoundName(round: number, totalRounds: number) {
  const remaining = totalRounds - round + 1
  if (remaining === 1) return "Final"
  if (remaining === 2) return "Semifinal"
  if (remaining === 3) return "Quartas de Final"
  if (remaining === 4) return "Oitavas de Final"
  return `${remaining}ª fase antes da final`
}

function shuffle<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5)
}

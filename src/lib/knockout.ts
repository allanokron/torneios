import prisma from "@/lib/prisma"
import { recalculateTournamentRanking } from "@/lib/ranking"

export const POINTS_RANKING_FORMAT = "points_ranking"
export const RANKING_ELIMINATION_FORMAT = "ranking_elimination"

type RankedPlayer = {
  userId: string
  position: number
  points: number
  wins: number
  losses: number
  user: {
    id: string
    name: string
    avatarUrl?: string | null
  }
}

type BracketInput =
  | {
      kind: "player"
      seed: number
      playerId: string
      name: string
      points: number
    }
  | {
      kind: "source"
      label: string
      round: number
      position: number
    }
  | {
      kind: "empty"
    }

export type KnockoutBracketEntry = {
  round: number
  position: number
  roundName: string
  status: "waiting" | "ready" | "bye" | "completed"
  homeSeed: number | null
  awaySeed: number | null
  homePlayerId: string | null
  awayPlayerId: string | null
  homeName: string | null
  awayName: string | null
  homeSourceLabel: string | null
  awaySourceLabel: string | null
  winnerId: string | null
  nextRound: number | null
  nextPosition: number | null
  nextSlot: "home" | "away" | null
  matchId?: string | null
  matchStatus?: string | null
}

export function normalizeTournamentFormat(format?: string | null) {
  if (format === "ranking_elimination" || format === "elimination" || format === "groups") {
    return RANKING_ELIMINATION_FORMAT
  }

  return POINTS_RANKING_FORMAT
}

export function isRankingElimination(format?: string | null) {
  return normalizeTournamentFormat(format) === RANKING_ELIMINATION_FORMAT
}

export async function getKnockoutState(tournamentId: string) {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      bracketMatches: {
        orderBy: [{ round: "asc" }, { position: "asc" }],
        include: {
          match: true,
        },
      },
      matches: {
        where: { phase: "ranking", status: { not: "cancelled" } },
        select: { id: true, status: true },
      },
    },
  })

  if (!tournament) {
    return null
  }

  const format = normalizeTournamentFormat(tournament.format)
  const rankings = await recalculateTournamentRanking(tournamentId)
  const qualifiers = tournament.knockoutQualifiers ?? Math.min(rankings.length, 12)
  const validationError = validateQualifiers(qualifiers, rankings.length)
  const isRankingComplete =
    tournament.matches.length > 0 &&
    tournament.matches.every((match) => match.status === "finished" || match.status === "wo")
  const locked = tournament.bracketMatches.length > 0 || Boolean(tournament.knockoutLockedAt)

  if (format !== RANKING_ELIMINATION_FORMAT) {
    return {
      format,
      locked: false,
      isRankingComplete,
      qualifiers,
      validationError: null,
      players: rankings,
      bracket: [],
    }
  }

  if (locked) {
    const playerIds = Array.from(
      new Set(
        tournament.bracketMatches.flatMap((entry) => [
          entry.homePlayerId,
          entry.awayPlayerId,
          entry.winnerId,
        ]).filter((id): id is string => Boolean(id))
      )
    )
    const users = await prisma.user.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, name: true, avatarUrl: true },
    })
    const userMap = new Map(users.map((user) => [user.id, user]))

    return {
      format,
      locked: true,
      isRankingComplete,
      qualifiers,
      validationError,
      players: rankings.slice(0, qualifiers),
      bracket: tournament.bracketMatches.map((entry) => ({
        round: entry.round,
        position: entry.position,
        roundName: entry.roundName,
        status: entry.status as KnockoutBracketEntry["status"],
        homeSeed: entry.homeSeed,
        awaySeed: entry.awaySeed,
        homePlayerId: entry.homePlayerId,
        awayPlayerId: entry.awayPlayerId,
        homeName: entry.homePlayerId ? userMap.get(entry.homePlayerId)?.name ?? null : null,
        awayName: entry.awayPlayerId ? userMap.get(entry.awayPlayerId)?.name ?? null : null,
        homeSourceLabel: entry.homeSourceLabel,
        awaySourceLabel: entry.awaySourceLabel,
        winnerId: entry.winnerId,
        nextRound: entry.nextRound,
        nextPosition: entry.nextPosition,
        nextSlot: entry.nextSlot as "home" | "away" | null,
        matchId: entry.matchId,
        matchStatus: entry.match?.status ?? null,
      })),
    }
  }

  return {
    format,
    locked: false,
    isRankingComplete,
    qualifiers,
    validationError,
    players: rankings.slice(0, qualifiers),
    bracket: validationError ? [] : generateBracket(rankings, qualifiers),
  }
}

export async function lockKnockoutBracket(tournamentId: string) {
  const state = await getKnockoutState(tournamentId)

  if (!state) {
    return { error: "Torneio não encontrado", status: 404 }
  }

  if (state.format !== RANKING_ELIMINATION_FORMAT) {
    return { error: "Este torneio não está configurado para mata-mata", status: 400 }
  }

  if (state.locked) {
    return { error: "O mata-mata já foi travado", status: 400 }
  }

  if (!state.isRankingComplete) {
    return { error: "Finalize todos os jogos do ranking antes de travar o mata-mata", status: 400 }
  }

  if (state.validationError) {
    return { error: state.validationError, status: 400 }
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } })
  if (!tournament) {
    return { error: "Torneio não encontrado", status: 404 }
  }

  for (const bracketEntry of state.bracket) {
    const created = await prisma.bracketMatch.create({
      data: {
        tournamentId,
        round: bracketEntry.round,
        position: bracketEntry.position,
        roundName: bracketEntry.roundName,
        status: bracketEntry.status,
        homeSeed: bracketEntry.homeSeed,
        awaySeed: bracketEntry.awaySeed,
        homePlayerId: bracketEntry.homePlayerId,
        awayPlayerId: bracketEntry.awayPlayerId,
        winnerId: bracketEntry.winnerId,
        homeSourceLabel: bracketEntry.homeSourceLabel,
        awaySourceLabel: bracketEntry.awaySourceLabel,
        nextRound: bracketEntry.nextRound,
        nextPosition: bracketEntry.nextPosition,
        nextSlot: bracketEntry.nextSlot,
      },
    })

    if (created.status === "ready" && created.homePlayerId && created.awayPlayerId) {
      await createKnockoutMatch(tournamentId, tournament.defaultMatchDuration, created.id)
    }
  }

  await prisma.tournament.update({
    where: { id: tournamentId },
    data: {
      rankingPhaseStatus: "closed",
      knockoutLockedAt: new Date(),
      status: "in_progress",
    },
  })

  return { state: await getKnockoutState(tournamentId), status: 200 }
}

export async function advanceKnockoutMatch(matchId: string, winnerId: string) {
  const bracketEntry = await prisma.bracketMatch.findUnique({
    where: { matchId },
  })

  if (!bracketEntry) return

  const winnerSeed =
    winnerId === bracketEntry.homePlayerId ? bracketEntry.homeSeed :
    winnerId === bracketEntry.awayPlayerId ? bracketEntry.awaySeed :
    null

  await prisma.bracketMatch.update({
    where: { id: bracketEntry.id },
    data: {
      status: "completed",
      winnerId,
    },
  })

  if (!bracketEntry.nextRound || !bracketEntry.nextPosition || !bracketEntry.nextSlot) {
    await prisma.tournament.update({
      where: { id: bracketEntry.tournamentId },
      data: { status: "finished" },
    })
    return
  }

  const next = await prisma.bracketMatch.findUnique({
    where: {
      tournamentId_round_position: {
        tournamentId: bracketEntry.tournamentId,
        round: bracketEntry.nextRound,
        position: bracketEntry.nextPosition,
      },
    },
  })

  if (!next) return

  const data = bracketEntry.nextSlot === "home"
    ? { homePlayerId: winnerId, homeSeed: winnerSeed, homeSourceLabel: null }
    : { awayPlayerId: winnerId, awaySeed: winnerSeed, awaySourceLabel: null }

  const updatedNext = await prisma.bracketMatch.update({
    where: { id: next.id },
    data,
  })

  if (
    updatedNext.homePlayerId &&
    updatedNext.awayPlayerId &&
    updatedNext.status !== "completed"
  ) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: bracketEntry.tournamentId },
      select: { defaultMatchDuration: true },
    })

    if (updatedNext.matchId) {
      await prisma.match.updateMany({
        where: {
          id: updatedNext.matchId,
          status: { notIn: ["finished", "wo"] },
        },
        data: {
          homePlayerId: updatedNext.homePlayerId,
          awayPlayerId: updatedNext.awayPlayerId,
        },
      })
    } else if (tournament) {
      await prisma.bracketMatch.update({
        where: { id: updatedNext.id },
        data: { status: "ready" },
      })
      await createKnockoutMatch(bracketEntry.tournamentId, tournament.defaultMatchDuration, updatedNext.id)
    }
  }
}

function validateQualifiers(qualifiers: number, rankedPlayers: number) {
  if (!Number.isInteger(qualifiers) || qualifiers < 2) {
    return "Informe pelo menos 2 classificados para o mata-mata"
  }

  if (qualifiers > rankedPlayers) {
    return "A quantidade de classificados não pode ser maior que a quantidade de jogadores no ranking"
  }

  return null
}

function generateBracket(rankings: RankedPlayer[], qualifiers: number): KnockoutBracketEntry[] {
  const players = rankings.slice(0, qualifiers).map((ranking, index) => ({
    kind: "player" as const,
    seed: index + 1,
    playerId: ranking.userId,
    name: ranking.user.name,
    points: ranking.points,
  }))
  const totalSlots = nextPowerOfTwo(qualifiers)
  const totalRounds = Math.log2(totalSlots)
  const seedOrder = generateSeedingOrder(totalSlots)
  let inputs: BracketInput[] = seedOrder.map((seed) => players[seed - 1] ?? { kind: "empty" })
  const bracket: KnockoutBracketEntry[] = []

  for (let round = 1; round <= totalRounds; round++) {
    const roundName = getRoundName(round, totalRounds)
    const nextInputs: BracketInput[] = []

    for (let index = 0; index < inputs.length; index += 2) {
      const position = index / 2 + 1
      const home = inputs[index]
      const away = inputs[index + 1] ?? { kind: "empty" as const }
      const homePlayer = home.kind === "player" ? home : null
      const awayPlayer = away.kind === "player" ? away : null
      const homeSource = home.kind === "source" ? home.label : null
      const awaySource = away.kind === "source" ? away.label : null
      const hasHome = home.kind !== "empty"
      const hasAway = away.kind !== "empty"
      const nextRound = round < totalRounds ? round + 1 : null
      const nextPosition = round < totalRounds ? Math.ceil(position / 2) : null
      const nextSlot = round < totalRounds ? (position % 2 === 1 ? "home" : "away") : null

      let status: KnockoutBracketEntry["status"] = "waiting"
      let winnerId: string | null = null
      let winnerInput: BracketInput = {
        kind: "source",
        label: `Vencedor ${roundName} ${position}`,
        round,
        position,
      }

      if (homePlayer && awayPlayer) {
        status = "ready"
      } else if (homePlayer && !hasAway) {
        status = "bye"
        winnerId = homePlayer.playerId
        winnerInput = homePlayer
      } else if (!hasHome && awayPlayer) {
        status = "bye"
        winnerId = awayPlayer.playerId
        winnerInput = awayPlayer
      }

      bracket.push({
        round,
        position,
        roundName,
        status,
        homeSeed: homePlayer?.seed ?? null,
        awaySeed: awayPlayer?.seed ?? null,
        homePlayerId: homePlayer?.playerId ?? null,
        awayPlayerId: awayPlayer?.playerId ?? null,
        homeName: homePlayer?.name ?? null,
        awayName: awayPlayer?.name ?? null,
        homeSourceLabel: homeSource,
        awaySourceLabel: awaySource,
        winnerId,
        nextRound,
        nextPosition,
        nextSlot,
      })

      nextInputs.push(winnerInput)
    }

    inputs = nextInputs
  }

  return bracket
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

async function createKnockoutMatch(tournamentId: string, duration: number, bracketMatchId: string) {
  const bracketEntry = await prisma.bracketMatch.findUnique({ where: { id: bracketMatchId } })
  if (!bracketEntry?.homePlayerId || !bracketEntry.awayPlayerId || bracketEntry.matchId) return

  const match = await prisma.match.create({
    data: {
      tournamentId,
      homePlayerId: bracketEntry.homePlayerId,
      awayPlayerId: bracketEntry.awayPlayerId,
      duration,
      status: "pending_scheduling",
      phase: "knockout",
      round: `${bracketEntry.roundName} ${bracketEntry.position}`,
    },
  })

  await prisma.bracketMatch.update({
    where: { id: bracketMatchId },
    data: {
      matchId: match.id,
      status: "ready",
    },
  })
}

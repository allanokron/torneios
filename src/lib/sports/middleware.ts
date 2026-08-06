import { prisma } from "@/lib/prisma"
import type { SportId } from "./types"

export class SportAccessError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "SportAccessError"
  }
}

/**
 * Validates that a tournament supports the given sport(s).
 * Throws SportAccessError if the tournament's sport is not in the allowed list.
 */
export async function validateSportAccess(
  tournamentId: string,
  allowedSports: SportId[]
): Promise<{ id: string; sport: string; name: string }> {
  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    select: { id: true, sport: true, name: true },
  })

  if (!tournament) {
    throw new SportAccessError("Torneio não encontrado")
  }

  if (!allowedSports.includes(tournament.sport as SportId)) {
    throw new SportAccessError(
      `Esta operação não é permitida para torneios de ${
        tournament.sport === "tennis" ? "tênis" : "vôlei de praia"
      }`
    )
  }

  return tournament
}

/**
 * Validates that a tournament's sport matches the expected sport.
 */
export async function validateTournamentSport(
  tournamentId: string,
  expectedSport: SportId
): Promise<{ id: string; sport: string; name: string }> {
  return validateSportAccess(tournamentId, [expectedSport])
}

/**
 * Returns true if the tournament's sport is in the allowed list.
 */
export async function isTournamentSportAllowed(
  tournamentId: string,
  allowedSports: SportId[]
): Promise<boolean> {
  try {
    await validateSportAccess(tournamentId, allowedSports)
    return true
  } catch {
    return false
  }
}

/**
 * Gets the sport-specific settings for a tournament.
 */
export async function getTennisSettings(tournamentId: string) {
  return prisma.tennisTournamentSettings.findUnique({
    where: { tournamentId },
  })
}

export async function getBeachVolleySettings(tournamentId: string) {
  return prisma.beachVolleyTournamentSettings.findUnique({
    where: { tournamentId },
  })
}

/**
 * Creates or updates sport-specific settings for a tournament.
 */
export async function upsertTennisSettings(
  tournamentId: string,
  data: Record<string, unknown>
) {
  return prisma.tennisTournamentSettings.upsert({
    where: { tournamentId },
    create: { tournamentId, ...data },
    update: data,
  })
}

export async function upsertBeachVolleySettings(
  tournamentId: string,
  data: Record<string, unknown>
) {
  return prisma.beachVolleyTournamentSettings.upsert({
    where: { tournamentId },
    create: { tournamentId, ...data },
    update: data,
  })
}

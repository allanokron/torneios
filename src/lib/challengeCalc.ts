import prisma from "./prisma"

type ChallengeConfig = {
  enabled: boolean
  rankingReference: string
  maxPositionsAhead: number
  pointsPerPosition: number
  challengerWinMultiplier: number
  challengerLossMultiplier: number
  challengedWinMultiplier: number
  challengedLossMultiplier: number
}

type ChallengeResult = {
  challengerPoints: number
  challengedPoints: number
  challengerWins: boolean
  positionDiff: number
  basePoints: number
}

export function calculateChallengePoints(
  challengerWins: boolean,
  positionDiff: number,
  config: ChallengeConfig
): ChallengeResult {
  const basePoints = positionDiff * config.pointsPerPosition

  let challengerPoints: number
  let challengedPoints: number

  if (challengerWins) {
    challengerPoints = Math.round(basePoints * config.challengerWinMultiplier)
    challengedPoints = Math.round(basePoints * config.challengedLossMultiplier)
  } else {
    challengerPoints = -Math.round(basePoints * config.challengerLossMultiplier)
    challengedPoints = Math.round(basePoints * config.challengedWinMultiplier)
  }

  return {
    challengerPoints,
    challengedPoints,
    challengerWins,
    positionDiff,
    basePoints,
  }
}

export function validateChallengePositions(
  challengerPosition: number,
  challengedPosition: number,
  maxPositionsAhead: number
): { valid: boolean; error?: string } {
  if (maxPositionsAhead <= 0) return { valid: true }

  const diff = challengerPosition - challengedPosition
  if (diff < 0) {
    return { valid: true }
  }
  if (diff > maxPositionsAhead) {
    return {
      valid: false,
      error: `Desafio inválido: você está ${diff} posições acima, máximo permitido é ${maxPositionsAhead}`,
    }
  }
  return { valid: true }
}

export async function getChallengeConfig(
  tournamentId: string
): Promise<ChallengeConfig | null> {
  const config = await prisma.challengeConfig.findUnique({
    where: { tournamentId },
  })
  if (!config || !config.enabled) return null
  return config
}

export function getChallengerId(
  homePlayerId: string,
  awayPlayerId: string,
  homePosition: number,
  awayPosition: number
): string {
  return homePosition > awayPosition ? homePlayerId : awayPlayerId
}

export function getChallengedId(
  homePlayerId: string,
  awayPlayerId: string,
  homePosition: number,
  awayPosition: number
): string {
  return homePosition > awayPosition ? awayPlayerId : homePlayerId
}

export async function getPlayerPosition(
  tournamentId: string,
  userId: string,
  referenceMonth?: string
): Promise<number | null> {
  if (referenceMonth) {
    const matchMonth = await prisma.match.findFirst({
      where: {
        tournamentId,
        OR: [
          { homePlayerId: userId },
          { awayPlayerId: userId },
        ],
        month: referenceMonth,
      },
    })
    if (!matchMonth) return null
  }

  const ranking = await prisma.playerRanking.findUnique({
    where: { tournamentId_userId: { tournamentId, userId } },
  })
  return ranking?.position ?? null
}

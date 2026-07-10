import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// POST — Generate elimination bracket from round-robin rankings (owner only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({ where: { id } })

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    if (tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas o organizador pode sortear o chaveamento" },
        { status: 403 }
      )
    }

    if (tournament.status !== "registration_closed") {
      return NextResponse.json(
        { error: "É necessário encerrar as inscrições antes de sortear" },
        { status: 400 }
      )
    }

    // Check if elimination matches already exist
    const existingElimination = await prisma.match.findFirst({
      where: {
        tournamentId: id,
        status: "pending_scheduling",
        homeScore: null,
        awayScore: null
      }
    })

    // Get rankings (sorted by points, then wins, etc.)
    const rankings = await prisma.playerRanking.findMany({
      where: { tournamentId: id },
      orderBy: [
        { points: "desc" },
        { wins: "desc" },
        { setBalance: "desc" }
      ],
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    })

    if (rankings.length < 2) {
      return NextResponse.json(
        { error: "É necessário pelo menos 2 jogadores classificados" },
        { status: 400 }
      )
    }

    // Take top 12 (or all if less than 12)
    const topPlayers = rankings.slice(0, 12)
    const numPlayers = topPlayers.length

    // Generate balanced bracket seeding
    // For 12 players: top 4 get byes
    const matchups = generateBalancedBracket(numPlayers)

    // Create elimination matches
    const eliminationMatches = []
    const roundNames: Record<number, string> = {}

    // Determine round names based on number of players
    if (numPlayers <= 2) {
      roundNames[1] = "Final"
    } else if (numPlayers <= 4) {
      roundNames[1] = "Semifinal"
      roundNames[2] = "Final"
    } else if (numPlayers <= 8) {
      roundNames[1] = "Quartas de Final"
      roundNames[2] = "Semifinal"
      roundNames[3] = "Final"
    } else {
      roundNames[1] = "Oitavas de Final"
      roundNames[2] = "Quartas de Final"
      roundNames[3] = "Semifinal"
      roundNames[4] = "Final"
    }

    for (const matchup of matchups) {
      if (matchup.bye) continue // Skip byes

      const homePlayer = topPlayers[matchup.homeIndex]
      const awayPlayer = topPlayers[matchup.awayIndex]

      if (!homePlayer || !awayPlayer) continue

      const match = await prisma.match.create({
        data: {
          tournamentId: id,
          homePlayerId: homePlayer.user.id,
          awayPlayerId: awayPlayer.user.id,
          status: "pending_scheduling",
          duration: tournament.defaultMatchDuration,
          // Store round info in a way we can query later
        }
      })

      eliminationMatches.push({
        id: match.id,
        round: matchup.round,
        roundName: roundNames[matchup.round] || `Rodada ${matchup.round}`,
        home: homePlayer.user.name,
        away: awayPlayer.user.name,
        homeSeed: matchup.homeIndex + 1,
        awaySeed: matchup.awayIndex + 1
      })
    }

    // Update tournament status
    await prisma.tournament.update({
      where: { id },
      data: { status: "in_progress" }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "bracket_created",
        entityType: "tournament",
        entityId: id,
        newValue: {
          phase: "elimination",
          players: topPlayers.map((p, i) => ({
            seed: i + 1,
            name: p.user.name,
            points: p.points
          })),
          matches: eliminationMatches.length
        }
      }
    })

    return NextResponse.json({
      success: true,
      bracket: {
        players: topPlayers.map((p, i) => ({
          seed: i + 1,
          name: p.user.name,
          points: p.points,
          wins: p.wins,
          losses: p.losses
        })),
        matches: eliminationMatches,
        roundNames
      }
    })
  } catch (error) {
    console.error("Erro ao gerar chaveamento:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// Generate balanced bracket matchups
// Returns array of matchups with round info
function generateBalancedBracket(numPlayers: number) {
  const matchups: Array<{
    homeIndex: number
    awayIndex: number
    round: number
    bye: boolean
  }> = []

  if (numPlayers <= 1) return matchups

  // Calculate number of rounds
  const numRounds = Math.ceil(Math.log2(numPlayers))
  const totalSlots = Math.pow(2, numRounds)

  // Standard tournament seeding for balanced bracket
  // Seeds are placed so that:
  // - 1st plays lowest seed in QF
  // - 2nd plays second lowest in opposite half
  // - Top seeds don't meet until final/semi

  // Generate seeding order for first round
  const firstRoundSeeds = generateSeedingOrder(totalSlots)

  // Filter to actual players and create matchups
  const round1Matchups: Array<{ home: number; away: number }> = []

  for (let i = 0; i < firstRoundSeeds.length; i += 2) {
    const seed1 = firstRoundSeeds[i]
    const seed2 = firstRoundSeeds[i + 1]

    const player1Index = seed1 - 1
    const player2Index = seed2 - 1

    if (player1Index >= numPlayers && player2Index >= numPlayers) {
      // Both are byes - skip
      continue
    }

    if (player1Index >= numPlayers) {
      // Player 1 is bye - player 2 gets walkover (skip matchup)
      continue
    }

    if (player2Index >= numPlayers) {
      // Player 2 is bye - player 1 gets walkover (skip matchup)
      continue
    }

    round1Matchups.push({ home: player1Index, away: player2Index })
  }

  // Create first round matchups
  for (const m of round1Matchups) {
    matchups.push({
      homeIndex: m.home,
      awayIndex: m.away,
      round: 1,
      bye: false
    })
  }

  return matchups
}

// Generate standard tournament seeding order
// For 8 players: 1v8, 4v5, 2v7, 3v6 (balanced halves)
function generateSeedingOrder(totalSlots: number): number[] {
  if (totalSlots <= 1) return [1]

  const order: number[] = []
  const half = totalSlots / 2

  // Recursively generate order
  const topHalf = generateSeedingOrder(half)

  for (let i = 0; i < half; i++) {
    order.push(topHalf[i])
    order.push(totalSlots + 1 - topHalf[i])
  }

  return order
}

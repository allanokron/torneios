import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

interface DrawMatch {
  homePlayerId: string
  awayPlayerId: string
  round: number
  scheduledAt: Date
}

function generateRoundRobinMatches(playerIds: string[]): Array<{ home: string; away: string }> {
  const matches: Array<{ home: string; away: string }> = []
  const n = playerIds.length

  // Round-robin algorithm: fix one player, rotate the rest
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < Math.floor(n / 2); j++) {
      const home = j === 0 ? playerIds[0] : playerIds[(i + j) % (n - 1) + 1]
      const away = j === 0 ? playerIds[(i + n - 1 - j) % (n - 1) + 1] : playerIds[(i + n - 1 - j) % (n - 1) + 1]
      if (home !== away) {
        matches.push({ home, away })
      }
    }
  }

  return matches
}

function distributeMatchesEvenly(
  matches: Array<{ home: string; away: string }>,
  startDate: Date,
  rankingDays: number,
  matchDurationMinutes: number = 120,
  maxMatchesPerDay: number = 4
): DrawMatch[] {
  const drawMatches: DrawMatch[] = []
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + rankingDays)

  // Get available dates (exclude weekends for simplicity, or include all days)
  const availableDates: Date[] = []
  const current = new Date(startDate)
  while (current <= endDate) {
    // Skip Sundays
    if (current.getDay() !== 0) {
      availableDates.push(new Date(current))
    }
    current.setDate(current.getDate() + 1)
  }

  // Shuffle matches randomly
  const shuffled = [...matches].sort(() => Math.random() - 0.5)

  // Distribute matches across available dates
  let matchIndex = 0
  let round = 1

  for (const date of availableDates) {
    if (matchIndex >= shuffled.length) break

    // Schedule up to maxMatchesPerDay matches on this date
    const matchesForDay = Math.min(maxMatchesPerDay, shuffled.length - matchIndex)

    for (let i = 0; i < matchesForDay; i++) {
      const match = shuffled[matchIndex]
      const scheduledAt = new Date(date)
      // Set time between 8:00 and 20:00
      const hour = 8 + Math.floor(Math.random() * 12)
      scheduledAt.setHours(hour, 0, 0, 0)

      drawMatches.push({
        homePlayerId: match.home,
        awayPlayerId: match.away,
        round,
        scheduledAt,
      })

      matchIndex++
    }

    // Increment round every 4 matches or so
    if (matchIndex % 4 === 0) {
      round++
    }
  }

  return drawMatches
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Get tournament
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        members: {
          where: { status: "accepted" },
          select: { userId: true }
        },
        matches: {
          select: { id: true }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    // Check if user is owner
    if (tournament.ownerId !== decoded.userId) {
      return NextResponse.json({ error: "Apenas o organizador pode sortear jogos" }, { status: 403 })
    }

    // Check if tournament is ready for drawing
    if (tournament.status !== "registration_closed" && tournament.status !== "in_progress") {
      return NextResponse.json({ 
        error: "O torneio precisa estar com inscrições encerradas para sortear jogos" 
      }, { status: 400 })
    }

    // Check if matches already exist
    if (tournament.matches.length > 0) {
      return NextResponse.json({ 
        error: "Já existem jogos sorteados para este torneio" 
      }, { status: 400 })
    }

    // Get confirmed members
    const memberIds = tournament.members.map(m => m.userId)

    if (memberIds.length < 2) {
      return NextResponse.json({ 
        error: "São necessários pelo menos 2 jogadores para sortear jogos" 
      }, { status: 400 })
    }

    // Generate round-robin matches
    const roundRobinMatches = generateRoundRobinMatches(memberIds)

    // Get tournament configuration
    const rankingDays = tournament.rankingPhaseDays || 60
    const matchDuration = tournament.defaultMatchDuration || 120

    // Calculate start date (from today or startDate)
    const startDate = tournament.startDate && new Date(tournament.startDate) > new Date()
      ? new Date(tournament.startDate)
      : new Date()

    // Distribute matches evenly
    const drawMatches = distributeMatchesEvenly(
      roundRobinMatches,
      startDate,
      rankingDays,
      matchDuration,
      Math.min(4, Math.ceil(memberIds.length / 2))
    )

    // Create matches in database
    const createdMatches = await prisma.$transaction(
      drawMatches.map(match => 
        prisma.match.create({
          data: {
            tournamentId,
            homePlayerId: match.homePlayerId,
            awayPlayerId: match.awayPlayerId,
            scheduledAt: match.scheduledAt,
            status: "pending_scheduling",
            round: `Rodada ${match.round}`,
          }
        })
      )
    )

    // Update tournament status to in_progress
    await prisma.tournament.update({
      where: { id: tournamentId },
      data: { status: "in_progress" }
    })

    return NextResponse.json({ 
      success: true, 
      matchesCreated: createdMatches.length,
      message: `${createdMatches.length} jogos sorteados com sucesso!`
    })

  } catch (error) {
    console.error("Erro ao sortear jogos:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

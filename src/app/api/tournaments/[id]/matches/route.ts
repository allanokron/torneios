import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const playerId = searchParams.get("playerId")

    const where: Record<string, unknown> = {
      tournamentId: id
    }

    if (status) {
      where.status = status
    }

    if (playerId) {
      where.OR = [
        { homePlayerId: playerId },
        { awayPlayerId: playerId }
      ]
    }

    const matches = await prisma.match.findMany({
      where,
      include: {
        homePlayer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        awayPlayer: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        court: {
          select: {
            id: true,
            name: true
          }
        },
        sets: {
          orderBy: { setNumber: "asc" }
        },
        scheduleProposals: {
          where: { status: "pending" },
          include: {
            sender: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        scheduledAt: "asc"
      }
    })

    return NextResponse.json({ matches })
  } catch (error) {
    console.error("Erro ao buscar partidas:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        members: {
          where: { status: "accepted" }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: "Torneio não encontrado" },
        { status: 404 }
      )
    }

    if (tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas o organizador pode gerar confrontos" },
        { status: 403 }
      )
    }

    if (tournament.status !== "registration_closed") {
      return NextResponse.json(
        { error: "As inscrições devem estar encerradas para gerar confrontos" },
        { status: 400 }
      )
    }

    const existingMatches = await prisma.match.count({
      where: { tournamentId: id }
    })

    if (existingMatches > 0) {
      return NextResponse.json(
        { error: "Confrontos já foram gerados para este torneio" },
        { status: 400 }
      )
    }

    const players = tournament.members.map(m => m.userId)
    
    if (players.length < 2) {
      return NextResponse.json(
        { error: "É necessário pelo menos 2 participantes para gerar confrontos" },
        { status: 400 }
      )
    }

    // Generate all combinations (round robin)
    const matchesToCreate: Array<{
      tournamentId: string
      homePlayerId: string
      awayPlayerId: string
      duration: number
      status: string
    }> = []

    for (let i = 0; i < players.length; i++) {
      for (let j = i + 1; j < players.length; j++) {
        // Randomly decide home/away
        const [home, away] = Math.random() > 0.5 
          ? [players[i], players[j]]
          : [players[j], players[i]]

        matchesToCreate.push({
          tournamentId: id,
          homePlayerId: home,
          awayPlayerId: away,
          duration: tournament.defaultMatchDuration,
          status: "pending_scheduling"
        })
      }
    }

    // Shuffle matches
    for (let i = matchesToCreate.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [matchesToCreate[i], matchesToCreate[j]] = [matchesToCreate[j], matchesToCreate[i]]
    }

    // Create matches in transaction
    const createdMatches = await prisma.$transaction(
      matchesToCreate.map(match => 
        prisma.match.create({
          data: match,
          include: {
            homePlayer: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            },
            awayPlayer: {
              select: {
                id: true,
                name: true,
                avatarUrl: true
              }
            }
          }
        })
      )
    )

    // Update tournament status
    await prisma.tournament.update({
      where: { id },
      data: { status: "in_progress" }
    })

    // Create notifications for all players
    for (const player of players) {
      await prisma.notification.create({
        data: {
          userId: player,
          title: "Confrontos gerados",
          message: `Os confrontos do torneio ${tournament.name} foram gerados!`,
          type: "match",
          link: `/tournaments/${id}/matches`
        }
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "matches_generated",
        entityType: "match",
        newValue: { count: createdMatches.length }
      }
    })

    return NextResponse.json({ 
      matches: createdMatches,
      count: createdMatches.length
    }, { status: 201 })
  } catch (error) {
    console.error("Erro ao gerar confrontos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
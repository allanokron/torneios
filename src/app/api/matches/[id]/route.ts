import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { recalculateTournamentRanking } from "@/lib/ranking"

export async function PATCH(
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

    const match = await prisma.match.findUnique({
      where: { id },
      include: { tournament: true, sets: true }
    })

    if (!match) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
    }

    if (match.tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas o organizador pode editar partidas" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { scheduledAt, homePlayerId, awayPlayerId, courtId, status, duration } = body

    const updateData: Record<string, unknown> = {}

    if (scheduledAt !== undefined) {
      updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null
    }
    if (homePlayerId !== undefined) {
      if (homePlayerId !== match.homePlayerId && homePlayerId !== match.awayPlayerId) {
        const player = await prisma.user.findUnique({ where: { id: homePlayerId } })
        if (!player) {
          return NextResponse.json({ error: "Jogador não encontrado" }, { status: 400 })
        }
      }
      updateData.homePlayerId = homePlayerId
    }
    if (awayPlayerId !== undefined) {
      if (awayPlayerId !== match.homePlayerId && awayPlayerId !== match.awayPlayerId) {
        const player = await prisma.user.findUnique({ where: { id: awayPlayerId } })
        if (!player) {
          return NextResponse.json({ error: "Jogador não encontrado" }, { status: 400 })
        }
      }
      updateData.awayPlayerId = awayPlayerId
    }
    if (courtId !== undefined) {
      updateData.courtId = courtId || null
    }
    if (status !== undefined) {
      const allowedStatuses = ["pending_scheduling", "scheduled", "in_progress", "finished", "cancelled", "wo"]
      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ error: "Status inválido" }, { status: 400 })
      }
      updateData.status = status
    }
    if (duration !== undefined) {
      updateData.duration = duration
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nenhum dado para atualizar" }, { status: 400 })
    }

    const updatedMatch = await prisma.match.update({
      where: { id },
      data: updateData,
      include: {
        homePlayer: { select: { id: true, name: true, avatarUrl: true } },
        awayPlayer: { select: { id: true, name: true, avatarUrl: true } },
        court: { select: { id: true, name: true } },
        sets: { orderBy: { setNumber: "asc" } }
      }
    })

    await prisma.auditLog.create({
      data: {
        tournamentId: match.tournamentId,
        userId: decoded.userId,
        action: "match_edited",
        entityType: "match",
        entityId: id,
        oldValue: {
          scheduledAt: match.scheduledAt,
          homePlayerId: match.homePlayerId,
          awayPlayerId: match.awayPlayerId,
          courtId: match.courtId,
          status: match.status
        },
        newValue: updateData as Record<string, string | number | null>
      }
    })

    return NextResponse.json({ match: updatedMatch })
  } catch (error) {
    console.error("Erro ao editar partida:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
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

    const match = await prisma.match.findUnique({
      where: { id },
      include: {
        tournament: {
          include: { scoringConfig: true }
        },
        sets: true
      }
    })

    if (!match) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 })
    }

    // Only tournament owner can delete
    if (match.tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas o organizador pode apagar partidas" },
        { status: 403 }
      )
    }

    // Delete related records
    await prisma.$transaction([
      prisma.set.deleteMany({ where: { matchId: id } }),
      prisma.scheduleProposal.deleteMany({ where: { matchId: id } }),
      prisma.rescheduleRequest.deleteMany({ where: { matchId: id } }),
      prisma.reservation.deleteMany({ where: { matchId: id } }),
      prisma.matchPhoto.deleteMany({ where: { matchId: id } }),
      prisma.message.deleteMany({ where: { matchId: id } }),
      prisma.penalty.deleteMany({ where: { matchId: id } }),
      prisma.contestation.deleteMany({ where: { matchId: id } }),
      prisma.match.delete({ where: { id } })
    ])

    await recalculateTournamentRanking(match.tournamentId)

    // Audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: match.tournamentId,
        userId: decoded.userId,
        action: "match_deleted",
        entityType: "match",
        entityId: id,
        oldValue: {
          homePlayerId: match.homePlayerId,
          awayPlayerId: match.awayPlayerId,
          status: match.status,
          winnerId: match.winnerId
        }
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao apagar partida:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

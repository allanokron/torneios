import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { canManageTournament } from "@/lib/platform-admin"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const tournament = await prisma.tournament.findUnique({ where: { id }, select: { id: true, ownerId: true } })
    if (!tournament) return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    if (!(await canManageTournament(decoded.userId, tournament.ownerId))) {
      return NextResponse.json({ error: "Apenas o organizador pode convidar árbitros" }, { status: 403 })
    }

    const body = await request.json()
    const refereeId = String(body.refereeId || "")
    if (!refereeId || refereeId === decoded.userId) {
      return NextResponse.json({ error: "Selecione um usuário válido para árbitro" }, { status: 400 })
    }

    const referee = await prisma.user.findUnique({ where: { id: refereeId }, select: { id: true, status: true } })
    if (!referee || referee.status !== "ACTIVE") {
      return NextResponse.json({ error: "Usuário não encontrado ou inativo" }, { status: 404 })
    }

    const invite = await prisma.tournamentRefereeInvite.upsert({
      where: { tournamentId_refereeId: { tournamentId: id, refereeId } },
      update: { status: "pending", senderId: decoded.userId, message: body.message || null, declinedAt: null },
      create: {
        tournamentId: id,
        senderId: decoded.userId,
        refereeId,
        message: body.message || null,
      },
      include: { referee: { select: { id: true, name: true, email: true } } },
    })

    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "referee_invited",
        entityType: "TournamentRefereeInvite",
        entityId: invite.id,
        newValue: { refereeId },
      },
    })

    return NextResponse.json({ invite })
  } catch (error) {
    console.error("Erro ao convidar árbitro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

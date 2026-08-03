import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { canManageTournament } from "@/lib/platform-admin"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ categoryId: string; teamId: string; memberId: string }> }
) {
  try {
    const { categoryId, teamId, memberId } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const category = await prisma.tournamentCategory.findUnique({
      where: { id: categoryId },
      include: { tournament: { select: { id: true, ownerId: true } } },
    })

    if (!category) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    if (!(await canManageTournament(decoded.userId, category.tournament.ownerId))) {
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const amountPaid = body.amountPaid !== undefined && body.amountPaid !== null && body.amountPaid !== ""
      ? Number(body.amountPaid)
      : category.registrationFee

    if (amountPaid !== null && amountPaid !== undefined && (!Number.isInteger(amountPaid) || amountPaid < 0)) {
      return NextResponse.json({ error: "Valor pago inválido" }, { status: 400 })
    }

    const member = await prisma.categoryTeamMember.findFirst({
      where: {
        id: memberId,
        teamId,
        team: { categoryId },
      },
      include: { team: true },
    })

    if (!member) {
      return NextResponse.json({ error: "Atleta da equipe não encontrado" }, { status: 404 })
    }

    const updated = await prisma.categoryTeamMember.update({
      where: { id: memberId },
      data: {
        paymentStatus: "MANUAL_CONFIRMED",
        amountPaid: amountPaid ?? null,
      },
    })

    await prisma.auditLog.create({
      data: {
        tournamentId: category.tournament.id,
        userId: decoded.userId,
        action: "category_payment_manual_confirmed",
        entityType: "CategoryTeamMember",
        entityId: memberId,
        newValue: { teamId, amountPaid },
      },
    })

    return NextResponse.json({ member: updated })
  } catch (error) {
    console.error("Erro ao confirmar pagamento manual:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

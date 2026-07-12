import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// PATCH — Update tiebreaker config (owner only)
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

    const tournament = await prisma.tournament.findUnique({ where: { id } })

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    if (tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este torneio" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { criteriaOrder } = body

    if (!criteriaOrder || !Array.isArray(criteriaOrder) || criteriaOrder.length === 0) {
      return NextResponse.json({ error: "Ordem dos critérios é obrigatória" }, { status: 400 })
    }

    // Upsert tiebreaker config
    const tiebreakerConfig = await prisma.tiebreakerConfig.upsert({
      where: { tournamentId: id },
      create: {
        tournamentId: id,
        criteriaOrder
      },
      update: {
        criteriaOrder
      }
    })

    // Audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "tiebreaker_updated",
        entityType: "tiebreaker_config",
        entityId: tiebreakerConfig.id,
        newValue: { criteriaOrder }
      }
    })

    return NextResponse.json({ tiebreakerConfig })
  } catch (error) {
    console.error("Erro ao atualizar regras de desempate:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

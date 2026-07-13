import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

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
        { error: "Apenas o organizador pode liberar jogos" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { matchIds } = body

    if (!Array.isArray(matchIds) || matchIds.length === 0) {
      return NextResponse.json({ error: "matchIds é obrigatório" }, { status: 400 })
    }

    const result = await prisma.match.updateMany({
      where: {
        id: { in: matchIds },
        tournamentId: id,
        status: "pending_scheduling",
      },
      data: {
        round: null,
      },
    })

    return NextResponse.json({ success: true, unlocked: result.count })
  } catch (error) {
    console.error("Erro ao liberar jogos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

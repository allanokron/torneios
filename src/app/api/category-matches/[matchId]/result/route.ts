import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { recordCategoryMatchResult } from "@/lib/category-tournament"
import { canManageTournament } from "@/lib/platform-admin"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const match = await prisma.categoryMatch.findUnique({
      where: { id: matchId },
      select: {
        category: { select: { tournament: { select: { ownerId: true } } } },
        homeTeamId: true,
        awayTeamId: true,
      },
    })
    if (!match) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
    if (!(await canManageTournament(decoded.userId, match.category.tournament.ownerId))) {
      return NextResponse.json({ error: "Você não tem permissão para lançar este resultado" }, { status: 403 })
    }

    const body = await request.json()
    const result = await recordCategoryMatchResult(matchId, {
      winnerTeamId: String(body.winnerTeamId),
      sets: Array.isArray(body.sets) ? body.sets : [],
      endReason: typeof body.endReason === "string" ? body.endReason : undefined,
    })
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json(result.match)
  } catch (error) {
    console.error("Erro ao lançar resultado da categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

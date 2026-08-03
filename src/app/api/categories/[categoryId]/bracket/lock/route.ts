import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { canManageTournament } from "@/lib/platform-admin"
import { lockCategoryBracket } from "@/lib/category-tournament"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const category = await prisma.tournamentCategory.findUnique({
      where: { id: categoryId },
      select: { tournament: { select: { id: true, ownerId: true } } },
    })
    if (!category) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    if (!(await canManageTournament(decoded.userId, category.tournament.ownerId))) {
      return NextResponse.json({ error: "Você não tem permissão para travar esta chave" }, { status: 403 })
    }

    const result = await lockCategoryBracket(categoryId)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    await prisma.auditLog.create({
      data: {
        tournamentId: category.tournament.id,
        userId: decoded.userId,
        action: "category_bracket_locked",
        entityType: "TournamentCategory",
        entityId: categoryId,
      },
    })

    return NextResponse.json(result.state)
  } catch (error) {
    console.error("Erro ao travar mata-mata da categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

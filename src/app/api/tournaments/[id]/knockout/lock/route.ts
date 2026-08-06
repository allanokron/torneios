import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { canManageTournament } from "@/lib/platform-admin"
import { lockKnockoutBracket } from "@/lib/knockout"
import { validateTournamentSport, SportAccessError } from "@/lib/sports/middleware"

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

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    // Validate sport - this endpoint is tennis-only
    try {
      await validateTournamentSport(id, "tennis")
    } catch (error) {
      if (error instanceof SportAccessError) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      throw error
    }

    if (!(await canManageTournament(decoded.userId, tournament.ownerId))) {
      return NextResponse.json({ error: "Apenas o organizador pode travar o mata-mata" }, { status: 403 })
    }

    const result = await lockKnockoutBracket(id)
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "knockout_locked",
        entityType: "tournament",
        entityId: id,
        newValue: { qualifiers: result.state?.qualifiers },
      },
    })

    return NextResponse.json(result.state)
  } catch (error) {
    console.error("Erro ao travar mata-mata:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

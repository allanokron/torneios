import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { recalculateTournamentRanking } from "@/lib/ranking"
import { validateTournamentSport, SportAccessError } from "@/lib/sports/middleware"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") || undefined

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

    const ranking = await recalculateTournamentRanking(id, month)

    return NextResponse.json({ ranking })
  } catch (error) {
    console.error("Erro ao buscar ranking:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

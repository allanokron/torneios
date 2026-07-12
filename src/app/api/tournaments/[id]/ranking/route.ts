import { NextResponse } from "next/server"
import { recalculateTournamentRanking } from "@/lib/ranking"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ranking = await recalculateTournamentRanking(id)

    return NextResponse.json({ ranking })
  } catch (error) {
    console.error("Erro ao buscar ranking:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import { getPublicTournament } from "@/lib/public-tournament"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournament = await getPublicTournament(id)
    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }
    return NextResponse.json({ tournament })
  } catch (error) {
    console.error("Erro ao buscar torneio público:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

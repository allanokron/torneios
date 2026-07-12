import { NextResponse } from "next/server"
import { getKnockoutState } from "@/lib/knockout"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const state = await getKnockoutState(id)

    if (!state) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    return NextResponse.json(state)
  } catch (error) {
    console.error("Erro ao buscar mata-mata:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

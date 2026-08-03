import { NextResponse } from "next/server"
import { getPublicCategory } from "@/lib/public-tournament"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const { id, categoryId } = await params
    const category = await getPublicCategory(categoryId)
    if (!category || category.tournamentId !== id) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }
    return NextResponse.json({ category })
  } catch (error) {
    console.error("Erro ao buscar categoria pública:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

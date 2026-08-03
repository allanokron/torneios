import { NextResponse } from "next/server"
import { getCategoryState } from "@/lib/category-tournament"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const category = await getCategoryState(categoryId)
    if (!category) {
      return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error("Erro ao carregar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

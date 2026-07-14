import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const document = await prisma.legalDocument.findFirst({
      where: { slug, isActive: true },
      select: {
        slug: true,
        title: true,
        version: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!document) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ document })
  } catch (error) {
    console.error("Erro ao buscar documento legal:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

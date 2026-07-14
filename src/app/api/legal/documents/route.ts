import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const documents = await prisma.legalDocument.findMany({
      where: { isActive: true },
      select: {
        slug: true,
        title: true,
        version: true,
        content: true,
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ documents })
  } catch (error) {
    console.error("Erro ao buscar documentos legais:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const email = searchParams.get("email")

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } }
      ]
    }

    if (email) {
      where.email = email
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        city: true,
        state: true,
        gameLevel: true
      },
      take: 20,
      orderBy: {
        name: "asc"
      }
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error("Erro ao buscar usuários:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
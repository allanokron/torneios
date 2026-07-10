import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        birthDate: true,
        bio: true,
        avatarUrl: true,
        gameLevel: true,
        dominantHand: true,
        createdAt: true
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Erro ao buscar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
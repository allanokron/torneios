import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        city: true,
        state: true,
        gameLevel: true,
        dominantHand: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            memberships: {
              where: { status: "accepted" }
            },
            matchesHome: true,
            matchesAway: true
          }
        }
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

export async function PATCH(request: Request) {
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

    const body = await request.json()
    const { name, phone, city, state, birthDate, bio, gameLevel, dominantHand, avatarUrl } = body

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        name: name || undefined,
        phone: phone || undefined,
        city: city || undefined,
        state: state || undefined,
        birthDate: birthDate ? new Date(birthDate) : undefined,
        bio: bio || undefined,
        gameLevel: gameLevel || undefined,
        dominantHand: dominantHand || undefined,
        avatarUrl: avatarUrl || undefined
      },
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
        dominantHand: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error("Erro ao atualizar perfil:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
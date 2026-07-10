import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password, phone, city, state, birthDate, bio, gameLevel, dominantHand } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Nome, e-mail e senha são obrigatórios" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "A senha deve ter pelo menos 6 caracteres" },
        { status: 400 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Este e-mail já está cadastrado" },
        { status: 400 }
      )
    }

    const passwordHash = await hashPassword(password)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone: phone || null,
        city: city || null,
        state: state || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        bio: bio || null,
        gameLevel: gameLevel || null,
        dominantHand: dominantHand || null,
        profile: {
          create: {}
        }
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true
      }
    })

    const token = generateToken(user.id)

    return NextResponse.json({
      user,
      token
    }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken, verifyPassword } from "@/lib/auth"

export async function POST(request: Request) {
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
    const { password, reason } = body

    if (!password) {
      return NextResponse.json(
        { error: "Senha é obrigatória" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { passwordHash: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const valid = await verifyPassword(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json(
        { error: "Senha incorreta" },
        { status: 401 }
      )
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null

    const deletion = await prisma.accountDeletion.create({
      data: {
        userId: decoded.userId,
        reason: reason || null,
        ipAddress: ip,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: decoded.userId,
        action: "account_deletion_requested",
        entityType: "AccountDeletion",
        entityId: deletion.id,
        newValue: { reason: reason || null },
        ipAddress: ip,
      },
    })

    return NextResponse.json({ success: true, deletion })
  } catch (error) {
    console.error("Erro ao solicitar exclusão de conta:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

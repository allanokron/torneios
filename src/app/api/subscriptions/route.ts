import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId: decoded.userId },
    })

    if (!subscription) {
      return NextResponse.json({ subscription: null })
    }

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Erro ao buscar assinatura:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Verificar se já tem assinatura
    const existing = await prisma.subscription.findUnique({
      where: { userId: decoded.userId },
    })

    if (existing && existing.status === "ACTIVE") {
      return NextResponse.json({ error: "Assinatura já ativa" }, { status: 400 })
    }

    // Criar ou atualizar assinatura
    const subscription = await prisma.subscription.upsert({
      where: { userId: decoded.userId },
      create: {
        userId: decoded.userId,
        status: "INACTIVE",
        monthlyValue: 9.90,
        tournamentCreditsUsed: 0,
      },
      update: {
        status: "INACTIVE",
      },
    })

    return NextResponse.json({ subscription })
  } catch (error) {
    console.error("Erro ao criar assinatura:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (action === "useCredit") {
      // Usar um crédito de torneio
      const subscription = await prisma.subscription.findUnique({
        where: { userId: decoded.userId },
      })

      if (!subscription || subscription.status !== "ACTIVE") {
        return NextResponse.json({ error: "Assinatura não ativa" }, { status: 400 })
      }

      if (subscription.tournamentCreditsUsed >= 2) {
        return NextResponse.json({ error: "Créditos esgotados" }, { status: 400 })
      }

      const updated = await prisma.subscription.update({
        where: { userId: decoded.userId },
        data: { tournamentCreditsUsed: subscription.tournamentCreditsUsed + 1 },
      })

      return NextResponse.json({ subscription: updated })
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
  } catch (error) {
    console.error("Erro ao atualizar assinatura:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

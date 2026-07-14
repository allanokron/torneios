import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { createSubscriptionCheckout, getDueDate } from "@/lib/asaas"

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

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Criar ou buscar assinatura
    let subscription = await prisma.subscription.findUnique({
      where: { userId: decoded.userId },
    })

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId: decoded.userId,
          status: "INACTIVE",
          monthlyValue: 9.90,
          tournamentCreditsUsed: 0,
        },
      })
    }

    // Criar checkout no Asaas
    const checkout = await createSubscriptionCheckout({
      customerName: user.name,
      customerEmail: user.email,
      customerCpfCnpj: user.email, // Usar email como identificador temporário
      value: 990, // R$ 9,90 em centavos
      cycle: "MONTHLY",
      nextDueDate: getDueDate(0), // Começa hoje
      externalReference: `subscription:${subscription.id}`,
    })

    return NextResponse.json({ checkoutUrl: checkout.url })
  } catch (error) {
    console.error("Erro ao criar checkout:", error)
    return NextResponse.json({ error: "Erro ao criar checkout" }, { status: 500 })
  }
}

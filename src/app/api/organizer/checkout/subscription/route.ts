import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { createSubscriptionCheckout, getDueDate } from "@/lib/asaas"
import { ensureDefaultOrganizerPlan } from "@/lib/organizer-access"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const [user, plan] = await Promise.all([
      prisma.user.findUnique({ where: { id: decoded.userId } }),
      ensureDefaultOrganizerPlan(),
    ])

    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

    const subscription = await prisma.subscription.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        planId: plan.id,
        status: "INACTIVE",
        monthlyValue: plan.monthlyValue / 100,
        tournamentCreditsUsed: 0,
      },
      update: {
        planId: plan.id,
        monthlyValue: plan.monthlyValue / 100,
      },
    })

    const checkout = await createSubscriptionCheckout({
      customerName: user.name,
      customerEmail: user.email,
      customerCpfCnpj: user.email,
      value: plan.monthlyValue,
      cycle: "MONTHLY",
      nextDueDate: getDueDate(0),
      externalReference: `subscription:${subscription.id}`,
    })

    return NextResponse.json({ checkoutUrl: checkout.url })
  } catch (error) {
    console.error("Erro ao criar checkout de organizador:", error)
    return NextResponse.json({ error: "Erro ao criar checkout" }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(request: NextRequest) {
  if (process.env.ASAAS_ENVIRONMENT !== "sandbox") {
    return NextResponse.json({ error: "Endpoint disponível apenas em sandbox" }, { status: 403 })
  }

  try {
    const { paymentId } = await request.json()

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId obrigatório" }, { status: 400 })
    }

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    })

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "PAID", paidAt: new Date() },
    })

    if (payment.type === "REGISTRATION" && payment.tournamentId) {
      await prisma.tournamentMember.updateMany({
        where: { tournamentId: payment.tournamentId, userId: payment.userId },
        data: {
          paymentStatus: "CONFIRMED",
          amountPaid: payment.value,
          status: "accepted",
          joinedAt: new Date(),
        },
      })
    }

    if (payment.type === "TOURNAMENT_EXTRA") {
      await prisma.organizerTournamentCredit.updateMany({
        where: { paymentId: payment.id },
        data: { status: "AVAILABLE" },
      })
    }

    await prisma.auditLog.create({
      data: {
        userId: payment.userId,
        tournamentId: payment.tournamentId,
        action: "SANDBOX_PAYMENT_CONFIRMED",
        entityType: "Payment",
        entityId: paymentId,
        newValue: { asaasPaymentId: payment.asaasPaymentId, value: payment.value },
      },
    })

    return NextResponse.json({ success: true, status: "PAID" })
  } catch (error) {
    console.error("Erro ao confirmar pagamento sandbox:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

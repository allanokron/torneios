import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { createCustomer, createPixPayment, getDueDate, getPixQrCode } from "@/lib/asaas"
import { SINGLE_TOURNAMENT_CREDIT_VALUE } from "@/lib/organizer-access"

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

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } })
    if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

    let customerId = user.asaasCustomerId
    if (!customerId) {
      const customer = await createCustomer({
        name: user.name || user.email,
        cpfCnpj: "52998224725",
        email: user.email,
        externalReference: user.id,
      })
      customerId = customer.id
      await prisma.user.update({ where: { id: user.id }, data: { asaasCustomerId: customerId } })
    }

    const payment = await createPixPayment({
      customerId,
      value: SINGLE_TOURNAMENT_CREDIT_VALUE,
      dueDate: getDueDate(0),
      description: "Abertura avulsa de torneio - Torneio+",
      externalReference: `tournament_credit:${user.id}:${Date.now()}`,
    })

    const dbPayment = await prisma.payment.create({
      data: {
        userId: user.id,
        type: "TOURNAMENT_EXTRA",
        asaasPaymentId: payment.id,
        asaasCustomerId: customerId,
        billingType: "PIX",
        value: SINGLE_TOURNAMENT_CREDIT_VALUE,
        status: "AWAITING_PIX",
        description: "Abertura avulsa de torneio - Torneio+",
        externalReference: payment.externalReference,
        expiresAt: new Date(payment.dueDate),
      },
    })

    const credit = await prisma.organizerTournamentCredit.create({
      data: {
        userId: user.id,
        paymentId: dbPayment.id,
        status: "PENDING_PAYMENT",
        value: SINGLE_TOURNAMENT_CREDIT_VALUE,
      },
    })

    const qrCode = await getPixQrCode(payment.id)
    return NextResponse.json({
      creditId: credit.id,
      paymentId: dbPayment.id,
      qrCode: qrCode.encodedImage,
      pixPayload: qrCode.payload,
      expiresAt: qrCode.expirationDate,
      value: SINGLE_TOURNAMENT_CREDIT_VALUE,
    })
  } catch (error) {
    console.error("Erro ao criar crédito avulso:", error)
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 })
  }
}

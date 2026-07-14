import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { createPixPayment, getPixQrCode, getDueDate } from "@/lib/asaas"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Buscar torneio
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    if (!tournament.registrationFee) {
      return NextResponse.json({ error: "Torneio não possui inscrição paga" }, { status: 400 })
    }

    // Verificar se já tem pagamento pendente
    const existingPayment = await prisma.payment.findFirst({
      where: {
        userId: decoded.userId,
        tournamentId,
        type: "REGISTRATION",
        status: { in: ["PENDING", "AWAITING_PIX", "PAID"] },
      },
    })

    if (existingPayment) {
      return NextResponse.json({
        paymentId: existingPayment.id,
        message: "Pagamento já existe",
      })
    }

    // Criar ou buscar cliente no Asaas
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Por enquanto, usar email como cpfCnpj temporário
    // TODO: Implementar coleta de CPF real
    const customerId = user.asaasCustomerId || user.email

    // Criar pagamento PIX
    const dueDate = getDueDate(0) // Vence hoje
    const pixPayment = await createPixPayment({
      customerId: customerId!,
      value: tournament.registrationFee,
      dueDate,
      description: `Inscrição - ${tournament.name}`,
      externalReference: `registration:${tournamentId}:${decoded.userId}`,
    })

    // Salvar pagamento no banco
    const dbPayment = await prisma.payment.create({
      data: {
        userId: decoded.userId,
        tournamentId,
        type: "REGISTRATION",
        asaasPaymentId: pixPayment.id,
        asaasCustomerId: customerId,
        billingType: "PIX",
        value: tournament.registrationFee,
        status: "AWAITING_PIX",
        description: `Inscrição - ${tournament.name}`,
        externalReference: `registration:${tournamentId}:${decoded.userId}`,
        expiresAt: new Date(pixPayment.dueDate),
      },
    })

    // Atualizar status do membro
    await prisma.tournamentMember.updateMany({
      where: {
        tournamentId,
        userId: decoded.userId,
      },
      data: {
        paymentStatus: "AWAITING_PIX",
        paymentId: dbPayment.id,
      },
    })

    // Obter QR Code
    const qrCode = await getPixQrCode(pixPayment.id)

    return NextResponse.json({
      paymentId: dbPayment.id,
      qrCode: qrCode.encodedImage,
      pixPayload: qrCode.payload,
      expiresAt: qrCode.expirationDate,
      value: tournament.registrationFee,
    })
  } catch (error) {
    console.error("Erro ao criar pagamento PIX:", error)
    return NextResponse.json({ error: "Erro ao criar pagamento" }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: tournamentId } = await params

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Buscar pagamentos do usuário para este torneio
    const payments = await prisma.payment.findMany({
      where: {
        userId: decoded.userId,
        tournamentId,
        type: "REGISTRATION",
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ payments })
  } catch (error) {
    console.error("Erro ao buscar pagamentos:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

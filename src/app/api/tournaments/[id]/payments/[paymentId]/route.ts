import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { getPaymentStatus, getPixQrCode } from "@/lib/asaas"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const { id: tournamentId, paymentId } = await params

    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    // Buscar pagamento no banco
    const payment = await prisma.payment.findFirst({
      where: {
        id: paymentId,
        userId: decoded.userId,
        tournamentId,
      },
    })

    if (!payment) {
      return NextResponse.json({ error: "Pagamento não encontrado" }, { status: 404 })
    }

    // Se tem asaasPaymentId, consultar status no Asaas
    if (payment.asaasPaymentId && payment.status !== "PAID") {
      try {
        const asaasPayment = await getPaymentStatus(payment.asaasPaymentId)

        // Atualizar status local
        const statusMap: Record<string, string> = {
          CREATED: "PENDING",
          WAITING_PAYMENT: "AWAITING_PIX",
          RECEIVED: "PAID",
          CONFIRMED: "PAID",
          OVERDUE: "OVERDUE",
          REFUNDED: "REFUNDED",
          CANCELED: "CANCELLED",
        }

        const newStatus = statusMap[asaasPayment.status] || payment.status

        if (newStatus !== payment.status) {
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: newStatus,
              paidAt: newStatus === "PAID" ? new Date() : undefined,
            },
          })

          // Se pagou, confirmar inscrição
          if (newStatus === "PAID" && payment.tournamentId) {
            await prisma.tournamentMember.updateMany({
              where: {
                tournamentId: payment.tournamentId,
                userId: decoded.userId,
              },
              data: {
                paymentStatus: "CONFIRMED",
                amountPaid: payment.value,
              },
            })
          }

          payment.status = newStatus
        }
      } catch (error) {
        console.error("Erro ao consultar status no Asaas:", error)
      }
    }

    // Se tem QR Code e está pendente, buscar novamente
    let qrCode = null
    if (payment.asaasPaymentId && (payment.status === "AWAITING_PIX" || payment.status === "PENDING")) {
      try {
        qrCode = await getPixQrCode(payment.asaasPaymentId)
      } catch (error) {
        console.error("Erro ao buscar QR Code:", error)
      }
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        value: payment.value,
        paidAt: payment.paidAt,
        expiresAt: payment.expiresAt,
      },
      qrCode: qrCode ? {
        image: qrCode.encodedImage,
        payload: qrCode.payload,
        expiresAt: qrCode.expirationDate,
      } : null,
    })
  } catch (error) {
    console.error("Erro ao consultar pagamento:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

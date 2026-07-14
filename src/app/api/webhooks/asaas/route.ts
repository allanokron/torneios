import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { validateWebhookToken } from "@/lib/asaas"

export async function POST(request: NextRequest) {
  try {
    // Validar token do webhook
    const authToken = request.headers.get("authorization")
    if (!validateWebhookToken(authToken)) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const body = await request.json()
    const { id: eventId, event, payment } = body

    // Verificar idempotência
    const existingEvent = await prisma.webhookEvent.findUnique({
      where: { asaasEventId: eventId },
    })

    if (existingEvent?.processed) {
      return NextResponse.json({ received: true, message: "Evento já processado" })
    }

    // Salvar evento
    await prisma.webhookEvent.upsert({
      where: { asaasEventId: eventId },
      create: {
        asaasEventId: eventId,
        eventType: event,
        payload: body,
      },
      update: {
        payload: body,
      },
    })

    // Processar evento
    switch (event) {
      case "PAYMENT_RECEIVED":
        await handlePaymentReceived(payment)
        break
      case "PAYMENT_OVERDUE":
        await handlePaymentOverdue(payment)
        break
      case "PAYMENT_CREATED":
        await handlePaymentCreated(payment)
        break
      case "SUBSCRIPTION_CREATED":
        await handleSubscriptionCreated(body.subscription)
        break
      case "SUBSCRIPTION_AUTHORIZED":
        await handleSubscriptionAuthorized(body.subscription)
        break
      case "SUBSCRIPTION_PAYMENT_FAILED":
        await handleSubscriptionPaymentFailed(body.subscription)
        break
      case "SUBSCRIPTION_CANCELLED":
        await handleSubscriptionCancelled(body.subscription)
        break
      default:
        console.log(`Evento não tratado: ${event}`)
    }

    // Marcar como processado
    await prisma.webhookEvent.update({
      where: { asaasEventId: eventId },
      data: { processed: true, processedAt: new Date() },
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Erro ao processar webhook:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

async function handlePaymentReceived(payment: { id: string; value: number; externalReference?: string }) {
  // Buscar pagamento no banco
  const dbPayment = await prisma.payment.findFirst({
    where: { asaasPaymentId: payment.id },
  })

  if (!dbPayment) {
    console.log(`Pagamento não encontrado: ${payment.id}`)
    return
  }

  // Atualizar pagamento
  await prisma.payment.update({
    where: { id: dbPayment.id },
    data: {
      status: "PAID",
      paidAt: new Date(),
    },
  })

  // Se for inscrição, confirmar membro do torneio
  if (dbPayment.type === "REGISTRATION" && dbPayment.tournamentId) {
    await prisma.tournamentMember.updateMany({
      where: {
        tournamentId: dbPayment.tournamentId,
        userId: dbPayment.userId,
      },
      data: {
        paymentStatus: "CONFIRMED",
        amountPaid: dbPayment.value,
      },
    })
  }

  // Registrar auditoria
  await prisma.auditLog.create({
    data: {
      userId: dbPayment.userId,
      tournamentId: dbPayment.tournamentId,
      action: "PAYMENT_RECEIVED",
      entityType: "Payment",
      entityId: dbPayment.id,
      newValue: { asaasPaymentId: payment.id, value: payment.value },
    },
  })
}

async function handlePaymentOverdue(payment: { id: string }) {
  const dbPayment = await prisma.payment.findFirst({
    where: { asaasPaymentId: payment.id },
  })

  if (!dbPayment) return

  await prisma.payment.update({
    where: { id: dbPayment.id },
    data: { status: "OVERDUE" },
  })

  // Se for inscrição, marcar PIX como expirado
  if (dbPayment.type === "REGISTRATION" && dbPayment.tournamentId) {
    await prisma.tournamentMember.updateMany({
      where: {
        tournamentId: dbPayment.tournamentId,
        userId: dbPayment.userId,
      },
      data: { paymentStatus: "PIX_EXPIRED" },
    })
  }
}

async function handlePaymentCreated(payment: { id: string; externalReference?: string }) {
  // Pagamento criado - apenas registrar se necessário
  console.log(`Pagamento criado: ${payment.id}`)
}

async function handleSubscriptionCreated(subscription: { id: string; customer: string } | undefined) {
  if (!subscription) return

  await prisma.subscription.updateMany({
    where: { asaasCustomerId: subscription.customer },
    data: {
      asaasSubscriptionId: subscription.id,
      status: "ACTIVE",
    },
  })
}

async function handleSubscriptionAuthorized(subscription: { id: string; customer: string } | undefined) {
  if (!subscription) return

  await prisma.subscription.updateMany({
    where: { asaasCustomerId: subscription.customer },
    data: {
      status: "ACTIVE",
      tournamentCreditsUsed: 0, // Resetar créditos ao assinar
    },
  })
}

async function handleSubscriptionPaymentFailed(subscription: { id: string; customer: string } | undefined) {
  if (!subscription) return

  await prisma.subscription.updateMany({
    where: { asaasSubscriptionId: subscription.id },
    data: { status: "PAST_DUE" },
  })
}

async function handleSubscriptionCancelled(subscription: { id: string; customer: string } | undefined) {
  if (!subscription) return

  await prisma.subscription.updateMany({
    where: { asaasSubscriptionId: subscription.id },
    data: { status: "CANCELLED" },
  })

  // Suspender torneios do organizador
  const dbSubscription = await prisma.subscription.findFirst({
    where: { asaasSubscriptionId: subscription.id },
  })

  if (dbSubscription) {
    // Torneios criados por este usuário podem ser suspensos
    // (implementar lógica de suspensão conforme necessário)
  }
}

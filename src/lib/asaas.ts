const ASAAS_API_KEY = process.env.ASAAS_API_KEY!
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || "https://api-sandbox.asaas.com/v3"
const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN!
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:3001"

const headers: Record<string, string> = {
  "Content-Type": "application/json",
  access_token: ASAAS_API_KEY,
}

// ==================== CUSTOMER ====================

export interface AsaasCustomer {
  id: string
  name: string
  cpfCnpj: string
  email?: string
  mobilePhone?: string
  externalReference?: string
}

export async function createCustomer(data: {
  name: string
  cpfCnpj: string
  email?: string
  phone?: string
  externalReference?: string
}): Promise<AsaasCustomer> {
  const res = await fetch(`${ASAAS_BASE_URL}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: data.name,
      cpfCnpj: data.cpfCnpj,
      email: data.email,
      mobilePhone: data.phone,
      externalReference: data.externalReference,
      notificationDisabled: true,
    }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Erro ao criar cliente Asaas: ${error.errors?.[0]?.description || res.statusText}`)
  }

  return res.json()
}

export async function getCustomer(customerId: string): Promise<AsaasCustomer> {
  const res = await fetch(`${ASAAS_BASE_URL}/customers/${customerId}`, {
    headers,
  })

  if (!res.ok) {
    throw new Error(`Erro ao buscar cliente Asaas: ${res.statusText}`)
  }

  return res.json()
}

// ==================== PIX PAYMENT ====================

export interface AsaasPayment {
  id: string
  customer: string
  billingType: string
  value: number
  status: string
  dueDate: string
  description?: string
  externalReference?: string
  dateCreated: string
}

export async function createPixPayment(data: {
  customerId: string
  value: number // em centavos
  dueDate: string // YYYY-MM-DD
  description?: string
  externalReference?: string
}): Promise<AsaasPayment> {
  const res = await fetch(`${ASAAS_BASE_URL}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      customer: data.customerId,
      billingType: "PIX",
      value: data.value / 100, // converter centavos para reais
      dueDate: data.dueDate,
      description: data.description,
      externalReference: data.externalReference,
    }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Erro ao criar cobrança PIX: ${error.errors?.[0]?.description || res.statusText}`)
  }

  return res.json()
}

export interface AsaasPixQrCode {
  encodedImage: string // base64
  payload: string // PIX copia e cola
  expirationDate: string
}

export async function getPixQrCode(paymentId: string): Promise<AsaasPixQrCode> {
  const res = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}/pixQrCode`, {
    method: "GET",
    headers,
  })

  if (!res.ok) {
    throw new Error(`Erro ao obter QR Code PIX: ${res.statusText}`)
  }

  return res.json()
}

export async function getPaymentStatus(paymentId: string): Promise<AsaasPayment> {
  const res = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
    headers,
  })

  if (!res.ok) {
    throw new Error(`Erro ao consultar pagamento: ${res.statusText}`)
  }

  return res.json()
}

export async function cancelPayment(paymentId: string): Promise<void> {
  const res = await fetch(`${ASAAS_BASE_URL}/payments/${paymentId}`, {
    method: "DELETE",
    headers,
  })

  if (!res.ok) {
    throw new Error(`Erro ao cancelar pagamento: ${res.statusText}`)
  }
}

// ==================== SUBSCRIPTION (CHECKOUT) ====================

export interface AsaasCheckout {
  url: string
  id: string
}

export async function createSubscriptionCheckout(data: {
  customerName: string
  customerEmail: string
  customerCpfCnpj: string
  customerPhone?: string
  value: number // em centavos
  cycle: "MONTHLY" | "BIWEEKLY" | "WEEKLY"
  nextDueDate: string // YYYY-MM-DD
  endDate?: string // YYYY-MM-DD
  externalReference?: string
}): Promise<AsaasCheckout> {
  const res = await fetch(`${ASAAS_BASE_URL}/checkouts`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      billingTypes: ["CREDIT_CARD"],
      chargeTypes: ["RECURRENT"],
      minutesToExpire: 60,
      callback: {
        successUrl: `${APP_BASE_URL}/dashboard?subscription=success`,
        cancelUrl: `${APP_BASE_URL}/dashboard?subscription=cancelled`,
        expiredUrl: `${APP_BASE_URL}/dashboard?subscription=expired`,
      },
      items: [
        {
          name: "Assinatura Torneio+",
          description: "Assinatura mensal - Acesso a criar torneios",
          value: data.value / 100,
          quantity: 1,
        },
      ],
      customerData: {
        name: data.customerName,
        email: data.customerEmail,
        cpfCnpj: data.customerCpfCnpj,
        phone: data.customerPhone,
      },
      subscription: {
        cycle: data.cycle,
        nextDueDate: data.nextDueDate,
        endDate: data.endDate,
      },
      externalReference: data.externalReference,
    }),
  })

  if (!res.ok) {
    const error = await res.json()
    throw new Error(`Erro ao criar checkout: ${error.errors?.[0]?.description || res.statusText}`)
  }

  return res.json()
}

// ==================== WEBHOOK VALIDATION ====================

export function validateWebhookToken(token: string | null): boolean {
  return token === ASAAS_WEBHOOK_TOKEN
}

// ==================== UTILITIES ====================

export function formatCurrency(valueInCents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100)
}

export function getDueDate(daysFromNow: number = 1): string {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split("T")[0]
}

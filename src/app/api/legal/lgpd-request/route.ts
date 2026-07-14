import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

const VALID_TYPES = [
  "access",
  "correction",
  "deletion",
  "portability",
  "revocation",
  "information",
  "other",
]

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, cpf, type, message } = body

    if (!name || !email || !type || !message) {
      return NextResponse.json(
        { error: "name, email, type e message são obrigatórios" },
        { status: 400 }
      )
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json(
        { error: `Tipo inválido. Valores aceitos: ${VALID_TYPES.join(", ")}` },
        { status: 400 }
      )
    }

    let userId: string | null = null
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      const decoded = verifyToken(token)
      if (decoded) {
        userId = decoded.userId
      }
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null

    const lgpdRequest = await prisma.lGPDRequest.create({
      data: {
        userId,
        name,
        email,
        cpf: cpf || null,
        type,
        message,
      },
    })

    await prisma.auditLog.create({
      data: {
        userId: userId ?? "anonymous",
        action: "lgpd_request_created",
        entityType: "LGPDRequest",
        entityId: lgpdRequest.id,
        newValue: { name, email, type, cpf: cpf || null },
        ipAddress: ip,
      },
    })

    return NextResponse.json({ success: true, request: lgpdRequest })
  } catch (error) {
    console.error("Erro ao criar solicitação LGPD:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    let userId: string | null = null
    const authHeader = request.headers.get("authorization")
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      const decoded = verifyToken(token)
      if (decoded) {
        userId = decoded.userId
      }
    }

    if (!userId) {
      return NextResponse.json({ requests: [] })
    }

    const requests = await prisma.lGPDRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error("Erro ao buscar solicitações LGPD:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

function parseUserAgent(ua: string | null) {
  if (!ua) return { os: null, device: null, language: null }
  const os = ua.includes("Windows")
    ? "Windows"
    : ua.includes("Mac")
      ? "macOS"
      : ua.includes("Linux")
        ? "Linux"
        : ua.includes("Android")
          ? "Android"
          : ua.includes("iPhone") || ua.includes("iPad")
            ? "iOS"
            : null
  const device = /Mobile|Android|iPhone|iPad/i.test(ua) ? "mobile" : "desktop"
  const language = ua.match(/(?:^|;\s*)([a-z]{2}(?:-[A-Z]{2})?)/)?.[1] ?? null
  return { os, device, language }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { documentSlug, accepted, consents } = body

    // Suportar formato single e batch
    const consentsList = consents || (documentSlug && typeof accepted === "boolean"
      ? [{ documentSlug, accepted }]
      : null)

    if (!consentsList || !Array.isArray(consentsList) || consentsList.length === 0) {
      return NextResponse.json(
        { error: "consents ou documentSlug+accepted são obrigatórios" },
        { status: 400 }
      )
    }

    const userAgent = request.headers.get("user-agent")
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null
    const { os, device, language } = parseUserAgent(userAgent)

    const results = []

    for (const c of consentsList) {
      const document = await prisma.legalDocument.findFirst({
        where: { slug: c.documentSlug, isActive: true },
      })

      if (!document) continue

      const consent = await prisma.consent.upsert({
        where: {
          userId_documentSlug_documentVersion: {
            userId: decoded.userId,
            documentSlug: document.slug,
            documentVersion: document.version,
          },
        },
        update: {
          accepted: c.accepted,
          ipAddress: ip,
          userAgent,
          os,
          device,
          language,
        },
        create: {
          userId: decoded.userId,
          documentId: document.id,
          documentSlug: document.slug,
          documentTitle: document.title,
          documentVersion: document.version,
          accepted: c.accepted,
          ipAddress: ip,
          userAgent,
          os,
          device,
          language,
        },
      })

      await prisma.auditLog.create({
        data: {
          userId: decoded.userId,
          action: c.accepted ? "consent_given" : "consent_revoked",
          entityType: "Consent",
          entityId: consent.id,
          newValue: {
            documentSlug: c.documentSlug,
            documentVersion: document.version,
            accepted: c.accepted,
          },
          ipAddress: ip,
        },
      })

      results.push(consent)
    }

    return NextResponse.json({ success: true, consents: results })
  } catch (error) {
    console.error("Erro ao registrar consentimento:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Token não fornecido" },
        { status: 401 }
      )
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: "Token inválido" },
        { status: 401 }
      )
    }

    const consents = await prisma.consent.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ consents })
  } catch (error) {
    console.error("Erro ao buscar consentimentos:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

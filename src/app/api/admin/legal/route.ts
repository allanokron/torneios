import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

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

    const ownsTournament = await prisma.tournament.findFirst({
      where: { ownerId: decoded.userId },
      select: { id: true },
    })

    if (!ownsTournament) {
      return NextResponse.json(
        { error: "Acesso negado" },
        { status: 403 }
      )
    }

    const [
      documents,
      consents,
      lgpdRequests,
      accountDeletions,
      consentsPerDocument,
    ] = await Promise.all([
      prisma.legalDocument.findMany({
        select: {
          id: true,
          slug: true,
          title: true,
          version: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { consents: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.consent.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.lGPDRequest.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.accountDeletion.findMany({
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.consent.groupBy({
        by: ["documentSlug", "documentVersion"],
        _count: { id: true },
        orderBy: { documentSlug: "asc" },
      }),
    ])

    const stats = {
      totalDocuments: documents.length,
      activeDocuments: documents.filter((d) => d.isActive).length,
      totalConsents: consents.length,
      pendingLgpdRequests: lgpdRequests.filter((r) => r.status === "pending")
        .length,
      totalLgpdRequests: lgpdRequests.length,
      pendingAccountDeletions: accountDeletions.filter(
        (d) => d.status === "pending"
      ).length,
      consentsPerDocument: consentsPerDocument.map((c) => ({
        documentSlug: c.documentSlug,
        documentVersion: c.documentVersion,
        count: c._count.id,
      })),
    }

    return NextResponse.json({
      documents,
      consents,
      lgpdRequests,
      accountDeletions,
      stats,
    })
  } catch (error) {
    console.error("Erro ao buscar dados admin:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

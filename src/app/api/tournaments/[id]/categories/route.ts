import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { buildCategoryName, validateCategoryPayload } from "@/lib/category-config"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const categories = await prisma.tournamentCategory.findMany({
      where: { tournamentId: id },
      orderBy: [{ createdAt: "asc" }],
      include: {
        _count: {
          select: {
            teams: true,
            groups: true,
            matches: true,
            bracketMatches: true,
          },
        },
      },
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error("Erro ao buscar categorias:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    if (tournament.ownerId !== decoded.userId) {
      return NextResponse.json({ error: "Você não tem permissão para criar categorias" }, { status: 403 })
    }

    const body = await request.json()
    const validationError = validateCategoryPayload(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const format = String(body.format)
    const hasGroupPhase = format === "group_ranking_knockout" || format === "group_knockout"
    const enableSilverSeries = Boolean(body.enableSilverSeries)
    const paymentMode = body.paymentMode === "online" ? "online" : "manual"
    const registrationFee = body.registrationFee === "" || body.registrationFee === null || body.registrationFee === undefined
      ? null
      : Number(body.registrationFee)

    const category = await prisma.tournamentCategory.create({
      data: {
        tournamentId: id,
        name: typeof body.name === "string" && body.name.trim()
          ? body.name.trim()
          : buildCategoryName({
              gender: String(body.gender),
              level: String(body.level),
              teamSize: String(body.teamSize),
            }),
        sport: String(body.sport ?? "beach_volley"),
        gender: String(body.gender),
        teamSize: String(body.teamSize),
        level: String(body.level),
        format,
        enableSilverSeries,
        paymentMode,
        registrationFee,
        groupSize: hasGroupPhase ? Number(body.groupSize) : null,
        goldQualifiersPerGroup: body.goldQualifiersPerGroup ? Number(body.goldQualifiersPerGroup) : null,
        silverQualifiersPerGroup: enableSilverSeries && body.silverQualifiersPerGroup ? Number(body.silverQualifiersPerGroup) : null,
        goldQualifiersTotal: body.goldQualifiersTotal ? Number(body.goldQualifiersTotal) : null,
        silverQualifiersTotal: enableSilverSeries && body.silverQualifiersTotal ? Number(body.silverQualifiersTotal) : null,
        oddGroupPolicy: typeof body.oddGroupPolicy === "string" && body.oddGroupPolicy ? body.oddGroupPolicy : null,
        setsPerMatch: Number(body.setsPerMatch ?? 3),
        normalSetPoints: Number(body.normalSetPoints ?? 21),
        tiebreakSetPoints: Number(body.tiebreakSetPoints ?? 15),
        minPointDifference: Number(body.minPointDifference ?? 2),
      },
    })

    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "category_created",
        entityType: "TournamentCategory",
        entityId: category.id,
        newValue: { name: category.name, format: category.format },
      },
    })

    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

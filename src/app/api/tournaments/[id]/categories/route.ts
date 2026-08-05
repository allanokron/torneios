import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { buildCategoryName, formatBeachVolleyCategoryName, validateCategoryPayload } from "@/lib/category-config"
import { canManageTournament } from "@/lib/platform-admin"

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
      select: { ownerId: true, setsPerMatch: true, hasTiebreak: true, tiebreakScore: true },
    })

    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    if (!(await canManageTournament(decoded.userId, tournament.ownerId))) {
      return NextResponse.json({ error: "Você não tem permissão para criar categorias" }, { status: 403 })
    }

    const body = await request.json()

    if (Array.isArray(body.categories)) {
      return createBatchCategories(body.categories, id, decoded.userId, tournament)
    }

    return createSingleCategory(body, id, decoded.userId, tournament)
  } catch (error) {
    console.error("Erro ao criar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

async function createSingleCategory(
  body: Record<string, unknown>,
  tournamentId: string,
  userId: string,
  tournament: { setsPerMatch: number; hasTiebreak: boolean; tiebreakScore: number }
) {
  const validationError = validateCategoryPayload(body)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const format = String(body.format)
  const hasGroupPhase = format === "group_ranking_knockout" || format === "group_knockout"
  const enableSilverSeries = Boolean(body.enableSilverSeries)
  const paymentMode = body.paymentMode === "online" ? "online" : "manual"
  const courtAssignmentMode = body.courtAssignmentMode === "automatic" ? "automatic" : "manual"
  const registrationFee = body.registrationFee === "" || body.registrationFee === null || body.registrationFee === undefined
    ? null
    : Number(body.registrationFee)

  const category = await prisma.tournamentCategory.create({
    data: {
      tournamentId,
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
      courtAssignmentMode,
      registrationFee,
      groupSize: hasGroupPhase ? Number(body.groupSize) : null,
      goldQualifiersPerGroup: body.goldQualifiersPerGroup ? Number(body.goldQualifiersPerGroup) : null,
      silverQualifiersPerGroup: enableSilverSeries && body.silverQualifiersPerGroup ? Number(body.silverQualifiersPerGroup) : null,
      goldQualifiersTotal: body.goldQualifiersTotal ? Number(body.goldQualifiersTotal) : null,
      silverQualifiersTotal: enableSilverSeries && body.silverQualifiersTotal ? Number(body.silverQualifiersTotal) : null,
      oddGroupPolicy: typeof body.oddGroupPolicy === "string" && body.oddGroupPolicy ? body.oddGroupPolicy : null,
      setsPerMatch: Number(body.setsPerMatch ?? tournament.setsPerMatch),
      normalSetPoints: Number(body.normalSetPoints ?? 21),
      tiebreakSetPoints: Number(body.tiebreakSetPoints ?? tournament.tiebreakScore),
      minPointDifference: Number(body.minPointDifference ?? 2),
    },
  })

  await prisma.auditLog.create({
    data: {
      tournamentId,
      userId,
      action: "category_created",
      entityType: "TournamentCategory",
      entityId: category.id,
      newValue: { name: category.name, format: category.format },
    },
  })

  return NextResponse.json({ category }, { status: 201 })
}

async function createBatchCategories(
  categories: Array<Record<string, unknown>>,
  tournamentId: string,
  userId: string,
  tournament: { setsPerMatch: number; hasTiebreak: boolean; tiebreakScore: number }
) {
  if (!categories.length) {
    return NextResponse.json({ error: "Nenhuma categoria fornecida" }, { status: 400 })
  }

  if (categories.length > 45) {
    return NextResponse.json({ error: "Máximo de 45 categorias por torneio" }, { status: 400 })
  }

  const format = String(categories[0].format ?? "group_ranking_knockout")
  const hasGroupPhase = format === "group_ranking_knockout" || format === "group_knockout"
  const enableSilverSeries = Boolean(categories[0].enableSilverSeries)

  const createdCategories = await prisma.$transaction(
    categories.map(cat => {
      const gender = String(cat.gender)
      const level = String(cat.level)
      const teamSize = String(cat.teamSize)
      const catFormat = String(cat.format ?? format)

      return prisma.tournamentCategory.create({
        data: {
          tournamentId,
          name: formatBeachVolleyCategoryName(gender, level, teamSize),
          sport: "beach_volley",
          gender,
          teamSize,
          level,
          format: catFormat,
          enableSilverSeries,
          paymentMode: "manual",
          courtAssignmentMode: "manual",
          registrationFee: null,
          groupSize: hasGroupPhase ? Number(cat.groupSize ?? 4) : null,
          goldQualifiersPerGroup: hasGroupPhase ? Number(cat.goldQualifiersPerGroup ?? 2) : null,
          silverQualifiersPerGroup: enableSilverSeries ? Number(cat.silverQualifiersPerGroup ?? 2) : null,
          goldQualifiersTotal: null,
          silverQualifiersTotal: null,
          oddGroupPolicy: "ranking_byes",
          setsPerMatch: tournament.setsPerMatch,
          normalSetPoints: Number(cat.normalSetPoints ?? 21),
          tiebreakSetPoints: tournament.tiebreakScore,
          minPointDifference: 2,
        },
      })
    })
  )

  await prisma.auditLog.create({
    data: {
      tournamentId,
      userId,
      action: "categories_batch_created",
      entityType: "TournamentCategory",
      newValue: { count: createdCategories.length, names: createdCategories.map(c => c.name) },
    },
  })

  return NextResponse.json({ categories: createdCategories }, { status: 201 })
}

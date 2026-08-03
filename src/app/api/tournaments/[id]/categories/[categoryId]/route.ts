import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { buildCategoryName, validateCategoryPayload } from "@/lib/category-config"

async function getOwnedCategory(tournamentId: string, categoryId: string, userId: string) {
  const category = await prisma.tournamentCategory.findUnique({
    where: { id: categoryId },
    include: {
      tournament: { select: { id: true, ownerId: true } },
      _count: { select: { teams: true, matches: true, bracketMatches: true, groups: true } },
    },
  })

  if (!category || category.tournamentId !== tournamentId) return null
  if (category.tournament.ownerId !== userId) return "forbidden"

  return category
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const { id, categoryId } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const category = await getOwnedCategory(id, categoryId, decoded.userId)
    if (!category) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    if (category === "forbidden") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    const body = await request.json()
    const validationError = validateCategoryPayload({
      sport: body.sport ?? category.sport,
      gender: body.gender ?? category.gender,
      teamSize: body.teamSize ?? category.teamSize,
      level: body.level ?? category.level,
      format: body.format ?? category.format,
      groupSize: body.groupSize ?? category.groupSize,
      registrationFee: body.registrationFee ?? category.registrationFee,
      setsPerMatch: body.setsPerMatch ?? category.setsPerMatch,
      normalSetPoints: body.normalSetPoints ?? category.normalSetPoints,
      tiebreakSetPoints: body.tiebreakSetPoints ?? category.tiebreakSetPoints,
      minPointDifference: body.minPointDifference ?? category.minPointDifference,
    })

    if (validationError) return NextResponse.json({ error: validationError }, { status: 400 })

    const hasCompetitionData = category._count.matches > 0 || category._count.bracketMatches > 0 || category._count.groups > 0
    const structuralFields = ["format", "teamSize", "groupSize", "goldQualifiersPerGroup", "silverQualifiersPerGroup", "goldQualifiersTotal", "silverQualifiersTotal"]
    if (hasCompetitionData && structuralFields.some(field => body[field] !== undefined)) {
      return NextResponse.json(
        { error: "Não é possível alterar formato, equipes ou classificações após gerar fases/jogos" },
        { status: 400 }
      )
    }

    const nextGender = String(body.gender ?? category.gender)
    const nextLevel = String(body.level ?? category.level)
    const nextTeamSize = String(body.teamSize ?? category.teamSize)
    const nextFormat = String(body.format ?? category.format)
    const hasGroupPhase = nextFormat === "group_ranking_knockout" || nextFormat === "group_knockout"
    const enableSilverSeries = body.enableSilverSeries !== undefined ? Boolean(body.enableSilverSeries) : category.enableSilverSeries

    const updated = await prisma.tournamentCategory.update({
      where: { id: categoryId },
      data: {
        name: typeof body.name === "string" && body.name.trim()
          ? body.name.trim()
          : body.name === null || body.name === ""
            ? buildCategoryName({ gender: nextGender, level: nextLevel, teamSize: nextTeamSize })
            : undefined,
        sport: body.sport !== undefined ? String(body.sport) : undefined,
        gender: body.gender !== undefined ? nextGender : undefined,
        teamSize: body.teamSize !== undefined ? nextTeamSize : undefined,
        level: body.level !== undefined ? nextLevel : undefined,
        format: body.format !== undefined ? nextFormat : undefined,
        status: body.status !== undefined ? String(body.status) : undefined,
        enableSilverSeries,
        paymentMode: body.paymentMode !== undefined ? (body.paymentMode === "online" ? "online" : "manual") : undefined,
        registrationFee: body.registrationFee !== undefined
          ? body.registrationFee === "" || body.registrationFee === null
            ? null
            : Number(body.registrationFee)
          : undefined,
        groupSize: body.groupSize !== undefined ? (hasGroupPhase ? Number(body.groupSize) : null) : undefined,
        goldQualifiersPerGroup: body.goldQualifiersPerGroup !== undefined ? Number(body.goldQualifiersPerGroup) || null : undefined,
        silverQualifiersPerGroup: body.silverQualifiersPerGroup !== undefined ? (enableSilverSeries ? Number(body.silverQualifiersPerGroup) || null : null) : undefined,
        goldQualifiersTotal: body.goldQualifiersTotal !== undefined ? Number(body.goldQualifiersTotal) || null : undefined,
        silverQualifiersTotal: body.silverQualifiersTotal !== undefined ? (enableSilverSeries ? Number(body.silverQualifiersTotal) || null : null) : undefined,
        oddGroupPolicy: body.oddGroupPolicy !== undefined ? (body.oddGroupPolicy || null) : undefined,
        setsPerMatch: body.setsPerMatch !== undefined ? Number(body.setsPerMatch) : undefined,
        normalSetPoints: body.normalSetPoints !== undefined ? Number(body.normalSetPoints) : undefined,
        tiebreakSetPoints: body.tiebreakSetPoints !== undefined ? Number(body.tiebreakSetPoints) : undefined,
        minPointDifference: body.minPointDifference !== undefined ? Number(body.minPointDifference) : undefined,
      },
    })

    return NextResponse.json({ category: updated })
  } catch (error) {
    console.error("Erro ao atualizar categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; categoryId: string }> }
) {
  try {
    const { id, categoryId } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const category = await getOwnedCategory(id, categoryId, decoded.userId)
    if (!category) return NextResponse.json({ error: "Categoria não encontrada" }, { status: 404 })
    if (category === "forbidden") return NextResponse.json({ error: "Sem permissão" }, { status: 403 })

    if (category._count.teams > 0 || category._count.matches > 0 || category._count.groups > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir categoria com equipes, grupos ou jogos" },
        { status: 400 }
      )
    }

    await prisma.tournamentCategory.delete({ where: { id: categoryId } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir categoria:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

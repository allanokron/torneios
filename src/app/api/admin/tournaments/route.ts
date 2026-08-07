import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requirePlatformAdmin } from "@/lib/platform-admin"
import { normalizeTournamentFormat, RANKING_ELIMINATION_FORMAT } from "@/lib/knockout"

export async function GET(request: Request) {
  const { response } = await requirePlatformAdmin(request)
  if (response) return response

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { location: { contains: search, mode: "insensitive" as const } },
          { city: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const tournaments = await prisma.tournament.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      _count: { select: { members: true, matches: true, payments: true } },
    },
  })

  return NextResponse.json({ tournaments })
}

export async function POST(request: Request) {
  const { admin, response } = await requirePlatformAdmin(request)
  if (response) return response

  try {
    const body = await request.json()
    const {
      name,
      description,
      coverImage,
      sport,
      format,
      knockoutQualifiers,
      location,
      address,
      city,
      state,
      startDate,
      endDate,
      registrationDeadline,
      maxParticipants,
      isPublic,
      inviteCode,
      setsPerMatch,
      setsToWin,
      setType,
      hasTiebreak,
      tiebreakScore,
      hasSuperTiebreak,
      superTiebreakScore,
      defaultMatchDuration,
      courtAssignmentMode,
      woCriteria,
      delayTolerance,
      generalRules,
      termsOfResponsibility,
      cancellationRules,
      autoFinishOnFirstSubmission,
      scoringConfig,
      tiebreakerConfig,
    } = body

    if (!name || !startDate) {
      return NextResponse.json(
        { error: "Nome e data de início são obrigatórios" },
        { status: 400 }
      )
    }

    const normalizedFormat = normalizeTournamentFormat(format)
    const parsedKnockoutQualifiers = knockoutQualifiers !== undefined && knockoutQualifiers !== null && knockoutQualifiers !== ""
      ? Number(knockoutQualifiers)
      : null

    if (
      normalizedFormat === RANKING_ELIMINATION_FORMAT &&
      parsedKnockoutQualifiers !== null &&
      (!Number.isInteger(parsedKnockoutQualifiers) || parsedKnockoutQualifiers < 2)
    ) {
      return NextResponse.json(
        { error: "Informe pelo menos 2 classificados para o mata-mata" },
        { status: 400 }
      )
    }

    const tournament = await prisma.tournament.create({
      data: {
        name,
        description: description || null,
        coverImage: coverImage || null,
        sport: sport || "tennis",
        format: normalizedFormat,
        knockoutQualifiers: normalizedFormat === RANKING_ELIMINATION_FORMAT ? parsedKnockoutQualifiers : null,
        location: location || null,
        address: address || null,
        city: city || null,
        state: state || null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        registrationDeadline: registrationDeadline ? new Date(registrationDeadline) : null,
        maxParticipants: maxParticipants || null,
        isPublic: isPublic !== false,
        inviteCode: inviteCode || null,
        ownerId: admin!.id,
        setsPerMatch: setsPerMatch || 3,
        setsToWin: setsToWin || 2,
        setType: setType || "standard",
        hasTiebreak: hasTiebreak !== false,
        tiebreakScore: tiebreakScore || 6,
        hasSuperTiebreak: hasSuperTiebreak !== false,
        superTiebreakScore: superTiebreakScore || 10,
        defaultMatchDuration: defaultMatchDuration || 120,
        courtAssignmentMode: courtAssignmentMode === "automatic" ? "automatic" : "manual",
        woCriteria: woCriteria || null,
        delayTolerance: delayTolerance || 15,
        generalRules: generalRules || null,
        termsOfResponsibility: termsOfResponsibility || null,
        cancellationRules: cancellationRules || null,
        autoFinishOnFirstSubmission: autoFinishOnFirstSubmission || false,
        registrationFee: null,
        paymentMethod: "PIX",
        pixExpirationMinutes: 30,
        isOrganizerPlayer: true,
        rankingPhaseDays: null,
        knockoutPhaseDays: null,
        members: {
          create: {
            userId: admin!.id,
            role: "organizer",
            status: "accepted",
            joinedAt: new Date(),
          },
        },
        scoringConfig: scoringConfig
          ? {
              create: {
                winWithoutLosingSet: scoringConfig.winWithoutLosingSet ?? 3,
                winLosingOneSet: scoringConfig.winLosingOneSet ?? 2,
                lossWinningOneSet: scoringConfig.lossWinningOneSet ?? 1,
                lossWithoutWinningSet: scoringConfig.lossWithoutWinningSet ?? 0,
                winByWO: scoringConfig.winByWO ?? 3,
                lossByWO: scoringConfig.lossByWO ?? 0,
                winByForfeit: scoringConfig.winByForfeit ?? 3,
                lossByForfeit: scoringConfig.lossByForfeit ?? 0,
                withdrawalPenalty: scoringConfig.withdrawalPenalty ?? -1,
                delayPenalty: scoringConfig.delayPenalty ?? -1,
              },
            }
          : undefined,
        tiebreakerConfig: tiebreakerConfig
          ? {
              create: {
                criteriaOrder: tiebreakerConfig.criteriaOrder || [
                  "points",
                  "wins",
                  "direct_confrontation",
                  "set_balance",
                  "sets_won",
                  "games_balance",
                  "games_won",
                  "fewer_wo",
                  "draw",
                ],
              },
            }
          : undefined,
      },
      include: {
        owner: { select: { id: true, name: true, avatarUrl: true } },
        members: true,
        scoringConfig: true,
        tiebreakerConfig: true,
      },
    })

    await prisma.auditLog.create({
      data: {
        tournamentId: tournament.id,
        userId: admin!.id,
        action: "created",
        entityType: "tournament",
        entityId: tournament.id,
        newValue: { name: tournament.name, byAdmin: true },
      },
    })

    return NextResponse.json({ tournament }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar torneio (admin):", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

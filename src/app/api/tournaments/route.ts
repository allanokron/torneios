import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { normalizeTournamentFormat, RANKING_ELIMINATION_FORMAT } from "@/lib/knockout"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } }
      ]
    }

    // Check if user is authenticated to show private tournaments
    const authHeader = request.headers.get("authorization")
    let currentUserId: string | null = null
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1]
      const decoded = verifyToken(token)
      if (decoded) currentUserId = decoded.userId
    }

    // Public tournaments visible to all, private only to members/owner
    if (currentUserId) {
      where.OR = [
        { isPublic: true },
        { ownerId: currentUserId },
        { members: { some: { userId: currentUserId } } }
      ]
    } else {
      where.isPublic = true
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        _count: {
          select: {
            members: {
              where: { status: "accepted" }
            },
            matches: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json({ tournaments })
  } catch (error) {
    console.error("Erro ao buscar torneios:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
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
      woCriteria,
      delayTolerance,
      generalRules,
      termsOfResponsibility,
      cancellationRules,
      autoFinishOnFirstSubmission,
      scoringConfig,
      tiebreakerConfig
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
        ownerId: decoded.userId,
        setsPerMatch: setsPerMatch || 3,
        setsToWin: setsToWin || 2,
        setType: setType || "standard",
        hasTiebreak: hasTiebreak !== false,
        tiebreakScore: tiebreakScore || 6,
        hasSuperTiebreak: hasSuperTiebreak !== false,
        superTiebreakScore: superTiebreakScore || 10,
        defaultMatchDuration: defaultMatchDuration || 120,
        woCriteria: woCriteria || null,
        delayTolerance: delayTolerance || 15,
        generalRules: generalRules || null,
        termsOfResponsibility: termsOfResponsibility || null,
        cancellationRules: cancellationRules || null,
        autoFinishOnFirstSubmission: autoFinishOnFirstSubmission || false,
        members: {
          create: {
            userId: decoded.userId,
            role: "organizer",
            status: "accepted",
            joinedAt: new Date()
          }
        },
        scoringConfig: scoringConfig ? {
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
            delayPenalty: scoringConfig.delayPenalty ?? -1
          }
        } : undefined,
        tiebreakerConfig: tiebreakerConfig ? {
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
              "draw"
            ]
          }
        } : undefined
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        members: true,
        scoringConfig: true,
        tiebreakerConfig: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: tournament.id,
        userId: decoded.userId,
        action: "created",
        entityType: "tournament",
        entityId: tournament.id,
        newValue: { name: tournament.name }
      }
    })

    return NextResponse.json({ tournament }, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar torneio:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

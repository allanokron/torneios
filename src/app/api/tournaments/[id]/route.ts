import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { normalizeTournamentFormat, RANKING_ELIMINATION_FORMAT } from "@/lib/knockout"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            city: true,
            state: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                city: true,
                state: true,
                gameLevel: true
              }
            }
          }
        },
        courts: true,
        scoringConfig: true,
        tiebreakerConfig: true,
        challengeConfig: true,
        _count: {
          select: {
            matches: true,
            announcements: true
          }
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: "Torneio não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json({ tournament })
  } catch (error) {
    console.error("Erro ao buscar torneio:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        members: {
          where: { userId: decoded.userId, role: "organizer" }
        },
        matches: {
          where: { status: "in_progress" }
        },
        bracketMatches: {
          select: { id: true },
          take: 1
        }
      }
    })

    if (!tournament) {
      return NextResponse.json(
        { error: "Torneio não encontrado" },
        { status: 404 }
      )
    }

    if (tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Você não tem permissão para editar este torneio" },
        { status: 403 }
      )
    }

    const body = await request.json()
    
    // Check if rules can be modified
    const hasInProgressMatches = tournament.matches.length > 0
    const rulesFields = [
      "setsPerMatch", "setsToWin", "setType", "hasTiebreak", "tiebreakScore",
      "hasSuperTiebreak", "superTiebreakScore"
    ]
    
    const hasRulesChange = rulesFields.some(field => body[field] !== undefined)
    
    if (hasInProgressMatches && hasRulesChange) {
      return NextResponse.json(
        { error: "Não é possível alterar regras enquanto houver partidas em andamento" },
        { status: 400 }
      )
    }

    const hasKnockoutConfigChange = body.format !== undefined || body.knockoutQualifiers !== undefined
    const knockoutLocked = Boolean(tournament.knockoutLockedAt) || tournament.bracketMatches.length > 0

    if (knockoutLocked && hasKnockoutConfigChange) {
      return NextResponse.json(
        { error: "Não é possível alterar o tipo do torneio ou classificados após travar o mata-mata" },
        { status: 400 }
      )
    }

    const normalizedFormat = body.format !== undefined
      ? normalizeTournamentFormat(body.format)
      : undefined
    const parsedKnockoutQualifiers =
      body.knockoutQualifiers !== undefined && body.knockoutQualifiers !== null && body.knockoutQualifiers !== ""
        ? Number(body.knockoutQualifiers)
        : body.knockoutQualifiers === null || body.knockoutQualifiers === ""
          ? null
          : undefined

    if (
      normalizedFormat === RANKING_ELIMINATION_FORMAT &&
      parsedKnockoutQualifiers !== undefined &&
      parsedKnockoutQualifiers !== null &&
      (!Number.isInteger(parsedKnockoutQualifiers) || parsedKnockoutQualifiers < 2)
    ) {
      return NextResponse.json(
        { error: "Informe pelo menos 2 classificados para o mata-mata" },
        { status: 400 }
      )
    }

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data: {
        name: body.name,
        description: body.description,
        coverImage: body.coverImage,
        location: body.location,
        address: body.address,
        city: body.city,
        state: body.state,
        startDate: body.startDate ? new Date(body.startDate) : undefined,
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        registrationDeadline: body.registrationDeadline ? new Date(body.registrationDeadline) : undefined,
        maxParticipants: body.maxParticipants,
        isPublic: body.isPublic,
        inviteCode: body.inviteCode,
        status: body.status,
        format: normalizedFormat,
        knockoutQualifiers: normalizedFormat === RANKING_ELIMINATION_FORMAT
          ? parsedKnockoutQualifiers
          : normalizedFormat === undefined
            ? parsedKnockoutQualifiers
            : null,
        setsPerMatch: body.setsPerMatch,
        setsToWin: body.setsToWin,
        setType: body.setType,
        hasTiebreak: body.hasTiebreak,
        tiebreakScore: body.tiebreakScore,
        hasSuperTiebreak: body.hasSuperTiebreak,
        superTiebreakScore: body.superTiebreakScore,
        defaultMatchDuration: body.defaultMatchDuration,
        woCriteria: body.woCriteria,
        delayTolerance: body.delayTolerance,
        generalRules: body.generalRules,
        termsOfResponsibility: body.termsOfResponsibility,
        cancellationRules: body.cancellationRules,
        autoFinishOnFirstSubmission: body.autoFinishOnFirstSubmission,
        maxPostponements: body.maxPostponements,
        postponementScope: body.postponementScope,
        registrationFee: body.registrationFee,
        paymentMethod: body.paymentMethod,
        pixExpirationMinutes: body.pixExpirationMinutes,
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
                city: true,
                state: true,
                gameLevel: true
              }
            }
          }
        },
        courts: true,
        scoringConfig: true,
        tiebreakerConfig: true,
        challengeConfig: true,
        _count: {
          select: {
            matches: true,
            announcements: true
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "updated",
        entityType: "tournament",
        entityId: id,
        oldValue: { name: tournament.name },
        newValue: { name: updatedTournament.name }
      }
    })

    return NextResponse.json({ tournament: updatedTournament })
  } catch (error) {
    console.error("Erro ao atualizar torneio:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

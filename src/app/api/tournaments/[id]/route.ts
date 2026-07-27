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
          select: {
            id: true,
            status: true,
            role: true,
            paymentStatus: true,
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

    // Build data object only with defined values
    const data: Record<string, unknown> = {}
    if (body.name !== undefined) data.name = body.name
    if (body.description !== undefined) data.description = body.description
    if (body.coverImage !== undefined) data.coverImage = body.coverImage
    if (body.location !== undefined) data.location = body.location
    if (body.address !== undefined) data.address = body.address
    if (body.city !== undefined) data.city = body.city
    if (body.state !== undefined) data.state = body.state
    if (body.startDate !== undefined) data.startDate = body.startDate ? new Date(body.startDate) : null
    if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
    if (body.registrationDeadline !== undefined) data.registrationDeadline = body.registrationDeadline ? new Date(body.registrationDeadline) : null
    if (body.maxParticipants !== undefined) data.maxParticipants = body.maxParticipants
    if (body.isPublic !== undefined) data.isPublic = body.isPublic
    if (body.inviteCode !== undefined) data.inviteCode = body.inviteCode
    if (body.status !== undefined) data.status = body.status
    if (normalizedFormat !== undefined) data.format = normalizedFormat
    if (parsedKnockoutQualifiers !== undefined) {
      data.knockoutQualifiers = normalizedFormat === RANKING_ELIMINATION_FORMAT || normalizedFormat === undefined
        ? parsedKnockoutQualifiers
        : null
    }
    if (body.setsPerMatch !== undefined) data.setsPerMatch = body.setsPerMatch
    if (body.setsToWin !== undefined) data.setsToWin = body.setsToWin
    if (body.setType !== undefined) data.setType = body.setType
    if (body.hasTiebreak !== undefined) data.hasTiebreak = body.hasTiebreak
    if (body.tiebreakScore !== undefined) data.tiebreakScore = body.tiebreakScore
    if (body.hasSuperTiebreak !== undefined) data.hasSuperTiebreak = body.hasSuperTiebreak
    if (body.superTiebreakScore !== undefined) data.superTiebreakScore = body.superTiebreakScore
    if (body.defaultMatchDuration !== undefined) data.defaultMatchDuration = body.defaultMatchDuration
    if (body.woCriteria !== undefined) data.woCriteria = body.woCriteria
    if (body.delayTolerance !== undefined) data.delayTolerance = body.delayTolerance
    if (body.generalRules !== undefined) data.generalRules = body.generalRules
    if (body.termsOfResponsibility !== undefined) data.termsOfResponsibility = body.termsOfResponsibility
    if (body.cancellationRules !== undefined) data.cancellationRules = body.cancellationRules
    if (body.autoFinishOnFirstSubmission !== undefined) data.autoFinishOnFirstSubmission = body.autoFinishOnFirstSubmission
    if (body.maxPostponements !== undefined) data.maxPostponements = body.maxPostponements
    if (body.postponementScope !== undefined) data.postponementScope = body.postponementScope
    if (body.registrationFee !== undefined) data.registrationFee = body.registrationFee
    if (body.paymentMethod !== undefined) data.paymentMethod = body.paymentMethod
    if (body.pixExpirationMinutes !== undefined) data.pixExpirationMinutes = body.pixExpirationMinutes
    if (body.rankingPhaseDays !== undefined) data.rankingPhaseDays = body.rankingPhaseDays
    if (body.knockoutPhaseDays !== undefined) data.knockoutPhaseDays = body.knockoutPhaseDays
    if (body.isOrganizerPlayer !== undefined) data.isOrganizerPlayer = body.isOrganizerPlayer

    const updatedTournament = await prisma.tournament.update({
      where: { id },
      data,
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

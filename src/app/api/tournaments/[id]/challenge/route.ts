import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// GET — Fetch challenge config (any authenticated user)
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = _request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const challengeConfig = await prisma.challengeConfig.findUnique({
      where: { tournamentId: id },
    })

    return NextResponse.json({ challengeConfig })
  } catch (error) {
    console.error("Erro ao buscar config de desafio:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

// PATCH — Update challenge config (owner only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const authHeader = request.headers.get("authorization")

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const tournament = await prisma.tournament.findUnique({ where: { id } })
    if (!tournament) {
      return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    }

    if (tournament.ownerId !== decoded.userId) {
      return NextResponse.json(
        { error: "Apenas o organizador pode editar configurações" },
        { status: 403 }
      )
    }

    const body = await request.json()

    const existing = await prisma.challengeConfig.findUnique({
      where: { tournamentId: id },
    })

    const challengeConfig = await prisma.challengeConfig.upsert({
      where: { tournamentId: id },
      create: {
        tournamentId: id,
        enabled: body.enabled ?? false,
        rankingReference: body.rankingReference ?? "previous_month",
        maxPositionsAhead: body.maxPositionsAhead ?? 0,
        pointsPerPosition: body.pointsPerPosition ?? 50,
        challengerWinMultiplier: body.challengerWinMultiplier ?? 1.0,
        challengerLossMultiplier: body.challengerLossMultiplier ?? 1.0,
        challengedWinMultiplier: body.challengedWinMultiplier ?? 0.5,
        challengedLossMultiplier: body.challengedLossMultiplier ?? 0,
        countWins: body.countWins ?? false,
        countSets: body.countSets ?? false,
        countGames: body.countGames ?? false,
        showChallengeColumn: body.showChallengeColumn ?? true,
      },
      update: {
        ...(body.enabled !== undefined && { enabled: body.enabled }),
        ...(body.rankingReference !== undefined && { rankingReference: body.rankingReference }),
        ...(body.maxPositionsAhead !== undefined && { maxPositionsAhead: body.maxPositionsAhead }),
        ...(body.pointsPerPosition !== undefined && { pointsPerPosition: body.pointsPerPosition }),
        ...(body.challengerWinMultiplier !== undefined && { challengerWinMultiplier: body.challengerWinMultiplier }),
        ...(body.challengerLossMultiplier !== undefined && { challengerLossMultiplier: body.challengerLossMultiplier }),
        ...(body.challengedWinMultiplier !== undefined && { challengedWinMultiplier: body.challengedWinMultiplier }),
        ...(body.challengedLossMultiplier !== undefined && { challengedLossMultiplier: body.challengedLossMultiplier }),
        ...(body.countWins !== undefined && { countWins: body.countWins }),
        ...(body.countSets !== undefined && { countSets: body.countSets }),
        ...(body.countGames !== undefined && { countGames: body.countGames }),
        ...(body.showChallengeColumn !== undefined && { showChallengeColumn: body.showChallengeColumn }),
      },
    })

    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: existing ? "challenge_config_updated" : "challenge_config_created",
        entityType: "challenge_config",
        entityId: challengeConfig.id,
        oldValue: existing
          ? {
              enabled: existing.enabled,
              rankingReference: existing.rankingReference,
              pointsPerPosition: existing.pointsPerPosition,
            }
          : undefined,
        newValue: {
          enabled: challengeConfig.enabled,
          rankingReference: challengeConfig.rankingReference,
          pointsPerPosition: challengeConfig.pointsPerPosition,
        },
      },
    })

    return NextResponse.json({ challengeConfig })
  } catch (error) {
    console.error("Erro ao atualizar config de desafio:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

// PATCH — Update scoring config (owner only, resets rankings if changed)
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
        { error: "Você não tem permissão para editar este torneio" },
        { status: 403 }
      )
    }

    const body = await request.json()

    // Check if any scoring value actually changed
    const existingScoring = await prisma.scoringConfig.findUnique({
      where: { tournamentId: id }
    })

    let hasChanges = false
    if (existingScoring) {
      hasChanges =
        (body.winWithoutLosingSet !== undefined && body.winWithoutLosingSet !== existingScoring.winWithoutLosingSet) ||
        (body.winLosingOneSet !== undefined && body.winLosingOneSet !== existingScoring.winLosingOneSet) ||
        (body.lossWinningOneSet !== undefined && body.lossWinningOneSet !== existingScoring.lossWinningOneSet) ||
        (body.lossWithoutWinningSet !== undefined && body.lossWithoutWinningSet !== existingScoring.lossWithoutWinningSet) ||
        (body.winByWO !== undefined && body.winByWO !== existingScoring.winByWO) ||
        (body.lossByWO !== undefined && body.lossByWO !== existingScoring.lossByWO) ||
        (body.withdrawalPenalty !== undefined && body.withdrawalPenalty !== existingScoring.withdrawalPenalty) ||
        (body.delayPenalty !== undefined && body.delayPenalty !== existingScoring.delayPenalty)
    } else {
      hasChanges = true
    }

    // Upsert scoring config
    const scoringConfig = await prisma.scoringConfig.upsert({
      where: { tournamentId: id },
      create: {
        tournamentId: id,
        winWithoutLosingSet: body.winWithoutLosingSet ?? 3,
        winLosingOneSet: body.winLosingOneSet ?? 2,
        lossWinningOneSet: body.lossWinningOneSet ?? 1,
        lossWithoutWinningSet: body.lossWithoutWinningSet ?? 0,
        winByWO: body.winByWO ?? 3,
        lossByWO: body.lossByWO ?? 0,
        withdrawalPenalty: body.withdrawalPenalty ?? -1,
        delayPenalty: body.delayPenalty ?? -1
      },
      update: {
        ...(body.winWithoutLosingSet !== undefined && { winWithoutLosingSet: body.winWithoutLosingSet }),
        ...(body.winLosingOneSet !== undefined && { winLosingOneSet: body.winLosingOneSet }),
        ...(body.lossWinningOneSet !== undefined && { lossWinningOneSet: body.lossWinningOneSet }),
        ...(body.lossWithoutWinningSet !== undefined && { lossWithoutWinningSet: body.lossWithoutWinningSet }),
        ...(body.winByWO !== undefined && { winByWO: body.winByWO }),
        ...(body.lossByWO !== undefined && { lossByWO: body.lossByWO }),
        ...(body.withdrawalPenalty !== undefined && { withdrawalPenalty: body.withdrawalPenalty }),
        ...(body.delayPenalty !== undefined && { delayPenalty: body.delayPenalty })
      }
    })

    // If scoring changed and there are existing rankings, reset them
    let rankingsReset = false
    if (hasChanges) {
      const existingRankings = await prisma.playerRanking.findMany({
        where: { tournamentId: id }
      })
      if (existingRankings.length > 0) {
        await prisma.playerRanking.deleteMany({ where: { tournamentId: id } })
        rankingsReset = true
      }
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        tournamentId: id,
        userId: decoded.userId,
        action: "scoring_updated",
        entityType: "scoring_config",
        entityId: scoringConfig.id,
        oldValue: existingScoring ? {
          winWithoutLosingSet: existingScoring.winWithoutLosingSet,
          winLosingOneSet: existingScoring.winLosingOneSet,
          lossWinningOneSet: existingScoring.lossWinningOneSet,
          lossWithoutWinningSet: existingScoring.lossWithoutWinningSet
        } : undefined,
        newValue: {
          winWithoutLosingSet: scoringConfig.winWithoutLosingSet,
          winLosingOneSet: scoringConfig.winLosingOneSet,
          lossWinningOneSet: scoringConfig.lossWinningOneSet,
          lossWithoutWinningSet: scoringConfig.lossWithoutWinningSet
        }
      }
    })

    return NextResponse.json({ scoringConfig, rankingsReset })
  } catch (error) {
    console.error("Erro ao atualizar pontuação:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

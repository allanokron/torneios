import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { recordCategoryMatchResult } from "@/lib/category-tournament"
import { recalculateTournamentRanking } from "@/lib/ranking"
import { advanceKnockoutMatch } from "@/lib/knockout"

type CategoryRefereeSet = { homePoints: number; awayPoints: number; isTiebreak: boolean }
type TournamentRefereeSet = {
  matchId: string
  setNumber: number
  homeGames: number
  awayGames: number
  isTiebreak: boolean
  isSuperTiebreak: boolean
}

function summarizeSets(sets: { home: number; away: number }[]) {
  return sets.reduce(
    (acc, set) => {
      if (set.home > set.away) acc.home += 1
      if (set.away > set.home) acc.away += 1
      return acc
    },
    { home: 0, away: 0 }
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const body = await request.json()
    const kind = body.kind === "tournament" ? "tournament" : "category"
    const endPhotoUrl = typeof body.endPhotoUrl === "string" ? body.endPhotoUrl.trim() : ""
    const rawSets = Array.isArray(body.sets) ? body.sets : []

    if (!endPhotoUrl) {
      return NextResponse.json({ error: "A foto do placar é obrigatória para finalizar a partida" }, { status: 400 })
    }
    if (!rawSets.length) {
      return NextResponse.json({ error: "Informe o placar antes de finalizar a partida" }, { status: 400 })
    }

    if (kind === "category") {
      const match = await prisma.categoryMatch.findUnique({
        where: { id: matchId },
        select: {
          id: true,
          status: true,
          refereeId: true,
          homeTeamId: true,
          awayTeamId: true,
          category: { select: { tournamentId: true } },
        },
      })
      if (!match) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
      if (match.status !== "in_progress") return NextResponse.json({ error: "A partida precisa estar em andamento" }, { status: 400 })
      if (match.refereeId !== decoded.userId) return NextResponse.json({ error: "Apenas o árbitro vinculado pode finalizar este jogo" }, { status: 403 })

      const referee = await prisma.tournamentReferee.findUnique({
        where: { tournamentId_userId: { tournamentId: match.category.tournamentId, userId: decoded.userId } },
      })
      if (!referee || referee.status !== "active") return NextResponse.json({ error: "Você não é árbitro deste torneio" }, { status: 403 })

      const sets: CategoryRefereeSet[] = rawSets.map((set: { homePoints?: number; awayPoints?: number; isTiebreak?: boolean }) => ({
        homePoints: Number(set.homePoints),
        awayPoints: Number(set.awayPoints),
        isTiebreak: Boolean(set.isTiebreak),
      }))
      const summary = summarizeSets(sets.map(set => ({ home: set.homePoints, away: set.awayPoints })))
      const winnerTeamId = summary.home > summary.away ? match.homeTeamId : match.awayTeamId
      const result = await recordCategoryMatchResult(matchId, { winnerTeamId, sets, endPhotoUrl, refereeId: decoded.userId })
      if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status })
      return NextResponse.json({ match: result.match })
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      include: { bracketMatch: true },
    })
    if (!match) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
    if (match.status !== "in_progress") return NextResponse.json({ error: "A partida precisa estar em andamento" }, { status: 400 })
    if (match.refereeId !== decoded.userId) return NextResponse.json({ error: "Apenas o árbitro vinculado pode finalizar este jogo" }, { status: 403 })

    const referee = await prisma.tournamentReferee.findUnique({
      where: { tournamentId_userId: { tournamentId: match.tournamentId, userId: decoded.userId } },
    })
    if (!referee || referee.status !== "active") return NextResponse.json({ error: "Você não é árbitro deste torneio" }, { status: 403 })

    const sets: TournamentRefereeSet[] = rawSets.map((set: { homeGames?: number; awayGames?: number; isTiebreak?: boolean; isSuperTiebreak?: boolean }, index: number) => ({
      matchId,
      setNumber: index + 1,
      homeGames: Number(set.homeGames),
      awayGames: Number(set.awayGames),
      isTiebreak: Boolean(set.isTiebreak),
      isSuperTiebreak: Boolean(set.isSuperTiebreak),
    }))
    const summary = summarizeSets(sets.map(set => ({ home: set.homeGames, away: set.awayGames })))
    const winnerId = summary.home > summary.away ? match.homePlayerId : match.awayPlayerId

    await prisma.$transaction([
      prisma.set.deleteMany({ where: { matchId } }),
      ...sets.map(set => prisma.set.create({ data: set })),
      prisma.match.update({
        where: { id: matchId },
        data: {
          status: "finished",
          winnerId,
          homeScore: summary.home,
          awayScore: summary.away,
          endPhotoUrl,
          finishedAt: new Date(),
          endReason: "normal",
        },
      }),
    ])

    await recalculateTournamentRanking(match.tournamentId)
    if (match.bracketMatch) await advanceKnockoutMatch(match.id, winnerId)

    const updated = await prisma.match.findUnique({ where: { id: matchId }, include: { sets: true } })
    return NextResponse.json({ match: updated })
  } catch (error) {
    console.error("Erro ao finalizar jogo pelo árbitro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

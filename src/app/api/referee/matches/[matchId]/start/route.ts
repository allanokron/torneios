import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

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

    const body = await request.json().catch(() => ({}))
    const kind = body.kind === "tournament" ? "tournament" : "category"
    const now = new Date()

    if (kind === "tournament") {
      const match = await prisma.match.findUnique({ where: { id: matchId }, select: { tournamentId: true, status: true, refereeId: true } })
      if (!match) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
      if (!["scheduled", "awaiting_start"].includes(match.status)) {
        return NextResponse.json({ error: "Este jogo não está aguardando início" }, { status: 400 })
      }
      if (match.refereeId && match.refereeId !== decoded.userId) {
        return NextResponse.json({ error: "Este jogo já está vinculado a outro árbitro" }, { status: 409 })
      }
      const referee = await prisma.tournamentReferee.findUnique({ where: { tournamentId_userId: { tournamentId: match.tournamentId, userId: decoded.userId } } })
      if (!referee || referee.status !== "active") return NextResponse.json({ error: "Você não é árbitro deste torneio" }, { status: 403 })

      const updated = await prisma.match.update({
        where: { id: matchId },
        data: { status: "in_progress", startedAt: now, refereeId: decoded.userId },
      })
      return NextResponse.json({ match: updated })
    }

    const match = await prisma.categoryMatch.findUnique({
      where: { id: matchId },
      select: { category: { select: { tournamentId: true } }, status: true, refereeId: true },
    })
    if (!match) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
    if (!["scheduled", "awaiting_start"].includes(match.status)) {
      return NextResponse.json({ error: "Este jogo não está aguardando início" }, { status: 400 })
    }
    if (match.refereeId && match.refereeId !== decoded.userId) {
      return NextResponse.json({ error: "Este jogo já está vinculado a outro árbitro" }, { status: 409 })
    }
    const referee = await prisma.tournamentReferee.findUnique({ where: { tournamentId_userId: { tournamentId: match.category.tournamentId, userId: decoded.userId } } })
    if (!referee || referee.status !== "active") return NextResponse.json({ error: "Você não é árbitro deste torneio" }, { status: 403 })

    const updated = await prisma.categoryMatch.update({
      where: { id: matchId },
      data: { status: "in_progress", startedAt: now, refereeId: decoded.userId },
    })
    return NextResponse.json({ match: updated })
  } catch (error) {
    console.error("Erro ao iniciar jogo pelo árbitro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

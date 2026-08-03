import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import { canManageTournament } from "@/lib/platform-admin"

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
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const tournament = await prisma.tournament.findUnique({ where: { id }, select: { ownerId: true } })
    if (!tournament) return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
    if (!(await canManageTournament(decoded.userId, tournament.ownerId))) {
      return NextResponse.json({ error: "Apenas o organizador pode mover jogos entre quadras" }, { status: 403 })
    }

    const body = await request.json()
    const courtId = String(body.courtId || "")
    const matchId = String(body.matchId || "")
    const kind = body.kind === "tournament" ? "tournament" : "category"

    const court = await prisma.court.findFirst({ where: { id: courtId, tournamentId: id } })
    if (!court) return NextResponse.json({ error: "Quadra não encontrada" }, { status: 404 })

    if (kind === "category") {
      const match = await prisma.categoryMatch.findFirst({ where: { id: matchId, category: { tournamentId: id } } })
      if (!match) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
      if (match.status === "in_progress") return NextResponse.json({ error: "Não é possível mover jogo em andamento" }, { status: 400 })

      const updated = await prisma.categoryMatch.update({
        where: { id: matchId },
        data: { courtId, status: match.status === "pending_scheduling" ? "scheduled" : match.status },
        include: { court: true, homeTeam: true, awayTeam: true },
      })
      return NextResponse.json({ match: updated })
    }

    const match = await prisma.match.findFirst({ where: { id: matchId, tournamentId: id } })
    if (!match) return NextResponse.json({ error: "Jogo não encontrado" }, { status: 404 })
    if (match.status === "in_progress") return NextResponse.json({ error: "Não é possível mover jogo em andamento" }, { status: 400 })

    const updated = await prisma.match.update({
      where: { id: matchId },
      data: { courtId, status: match.status === "pending_scheduling" ? "scheduled" : match.status },
      include: { court: true, homePlayer: true, awayPlayer: true },
    })
    return NextResponse.json({ match: updated })
  } catch (error) {
    console.error("Erro ao atribuir quadra:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
  }

  const decoded = verifyToken(authHeader.split(" ")[1])
  if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

  const referee = await prisma.tournamentReferee.findUnique({
    where: { tournamentId_userId: { tournamentId: id, userId: decoded.userId } },
  })
  if (!referee || referee.status !== "active") {
    return NextResponse.json({ error: "Você não é árbitro ativo deste torneio" }, { status: 403 })
  }

  const courts = await prisma.court.findMany({
    where: { tournamentId: id },
    orderBy: [{ number: "asc" }, { name: "asc" }],
    include: {
      matches: {
        where: { status: { in: ["scheduled", "awaiting_start", "in_progress"] } },
        include: {
          homePlayer: { select: { id: true, name: true } },
          awayPlayer: { select: { id: true, name: true } },
          referee: { select: { id: true, name: true } },
        },
        orderBy: [{ status: "desc" }, { scheduledAt: "asc" }],
      },
    },
  })

  return NextResponse.json({ courts })
}

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
  }

  const decoded = verifyToken(authHeader.split(" ")[1])
  if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

  const [assignments, invites] = await Promise.all([
    prisma.tournamentReferee.findMany({
      where: { userId: decoded.userId, status: "active" },
      include: {
        tournament: {
          select: { id: true, name: true, startDate: true, endDate: true, location: true, city: true, state: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tournamentRefereeInvite.findMany({
      where: { refereeId: decoded.userId, status: "pending" },
      include: {
        tournament: { select: { id: true, name: true, startDate: true, location: true, city: true, state: true } },
        sender: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  return NextResponse.json({ assignments, invites })
}

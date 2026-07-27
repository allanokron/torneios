import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const token = authHeader.split(" ")[1]
    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json({ error: "Token inválido" }, { status: 401 })
    }

    const pendingInvitations = await prisma.tournamentMember.findMany({
      where: {
        userId: decoded.userId,
        status: "pending",
      },
      include: {
        tournament: {
          select: {
            id: true,
            name: true,
            status: true,
            startDate: true,
            registrationFee: true,
            owner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { joinedAt: "desc" },
    })

    return NextResponse.json({ invitations: pendingInvitations })
  } catch (error) {
    console.error("Erro ao buscar convites:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

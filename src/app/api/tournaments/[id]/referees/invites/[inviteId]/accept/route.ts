import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; inviteId: string }> }
) {
  try {
    const { id, inviteId } = await params
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Token não fornecido" }, { status: 401 })
    }

    const decoded = verifyToken(authHeader.split(" ")[1])
    if (!decoded) return NextResponse.json({ error: "Token inválido" }, { status: 401 })

    const invite = await prisma.tournamentRefereeInvite.findFirst({
      where: { id: inviteId, tournamentId: id, refereeId: decoded.userId },
    })
    if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 })

    const acceptedAt = new Date()
    const [updatedInvite, referee] = await prisma.$transaction([
      prisma.tournamentRefereeInvite.update({
        where: { id: invite.id },
        data: { status: "accepted", acceptedAt },
      }),
      prisma.tournamentReferee.upsert({
        where: { tournamentId_userId: { tournamentId: id, userId: decoded.userId } },
        update: { status: "active", invitedById: invite.senderId, acceptedAt },
        create: {
          tournamentId: id,
          userId: decoded.userId,
          status: "active",
          invitedById: invite.senderId,
          acceptedAt,
        },
      }),
    ])

    return NextResponse.json({ invite: updatedInvite, referee })
  } catch (error) {
    console.error("Erro ao aceitar convite de árbitro:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"

export async function GET(request: Request) {
  try {
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

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        city: true,
        state: true,
        birthDate: true,
        bio: true,
        avatarUrl: true,
        gameLevel: true,
        dominantHand: true,
        createdAt: true,
        updatedAt: true,
        profile: true,
        memberships: {
          select: {
            id: true,
            role: true,
            status: true,
            joinedAt: true,
            tournament: {
              select: { id: true, name: true, sport: true },
            },
          },
        },
        matchesHome: {
          select: {
            id: true,
            status: true,
            homeScore: true,
            awayScore: true,
            scheduledAt: true,
            finishedAt: true,
            tournament: { select: { id: true, name: true } },
            awayPlayer: { select: { id: true, name: true } },
          },
        },
        matchesAway: {
          select: {
            id: true,
            status: true,
            homeScore: true,
            awayScore: true,
            scheduledAt: true,
            finishedAt: true,
            tournament: { select: { id: true, name: true } },
            homePlayer: { select: { id: true, name: true } },
          },
        },
        rankings: {
          select: {
            id: true,
            position: true,
            points: true,
            matchesPlayed: true,
            wins: true,
            losses: true,
            tournament: { select: { id: true, name: true } },
          },
        },
        consents: {
          select: {
            id: true,
            documentSlug: true,
            documentTitle: true,
            documentVersion: true,
            accepted: true,
            createdAt: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      )
    }

    const payments = await prisma.reservation.findMany({
      where: {
        match: {
          OR: [
            { homePlayerId: decoded.userId },
            { awayPlayerId: decoded.userId },
          ],
        },
      },
      select: {
        id: true,
        startTime: true,
        endTime: true,
        isConfirmed: true,
        isCancelled: true,
        court: { select: { id: true, name: true } },
        match: {
          select: {
            id: true,
            tournament: { select: { id: true, name: true } },
          },
        },
      },
    })

    return NextResponse.json({ user: { ...user, payments } })
  } catch (error) {
    console.error("Erro ao exportar dados do usuário:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ranking = await prisma.playerRanking.findMany({
      where: { tournamentId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            city: true,
            state: true
          }
        }
      },
      orderBy: [
        { points: "desc" },
        { wins: "desc" },
        { setBalance: "desc" },
        { gamesBalance: "desc" }
      ]
    })

    // Update positions
    const updatedRanking = await Promise.all(
      ranking.map(async (player, index) => {
        if (player.position !== index + 1) {
          await prisma.playerRanking.update({
            where: { id: player.id },
            data: { position: index + 1 }
          })
        }
        return { ...player, position: index + 1 }
      })
    )

    return NextResponse.json({ ranking: updatedRanking })
  } catch (error) {
    console.error("Erro ao buscar ranking:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
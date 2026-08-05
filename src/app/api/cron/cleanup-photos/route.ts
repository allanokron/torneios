import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

    const tournaments = await prisma.tournament.findMany({
      where: {
        status: "finished",
        photosCleanupAt: null,
        endDate: {
          lte: twentyFourHoursAgo,
        },
      },
      select: {
        id: true,
        name: true,
      },
    })

    let totalCleaned = 0

    for (const tournament of tournaments) {
      const cleanedMatches = await prisma.match.updateMany({
        where: {
          tournamentId: tournament.id,
          startPhotoUrl: { not: null },
        },
        data: {
          startPhotoUrl: null,
        },
      })

      const cleanedCategoryMatches = await prisma.categoryMatch.updateMany({
        where: {
          category: {
            tournamentId: tournament.id,
          },
          startPhotoUrl: { not: null },
        },
        data: {
          startPhotoUrl: null,
        },
      })

      await prisma.tournament.update({
        where: { id: tournament.id },
        data: { photosCleanupAt: new Date() },
      })

      totalCleaned += cleanedMatches.count + cleanedCategoryMatches.count
    }

    return NextResponse.json({
      success: true,
      tournamentsProcessed: tournaments.length,
      photosCleaned: totalCleaned,
    })
  } catch (error) {
    console.error("Erro na limpeza de fotos:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

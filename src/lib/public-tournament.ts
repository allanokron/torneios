import prisma from "@/lib/prisma"

export async function getPublicTournament(tournamentId: string) {
  return prisma.tournament.findFirst({
    where: { id: tournamentId, visibilityStatus: "ACTIVE" },
    select: {
      id: true,
      name: true,
      description: true,
      coverImage: true,
      sport: true,
      status: true,
      startDate: true,
      endDate: true,
      location: true,
      city: true,
      state: true,
    },
  })
}

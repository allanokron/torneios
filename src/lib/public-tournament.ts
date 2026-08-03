import prisma from "@/lib/prisma"

export async function getPublicTournament(tournamentId: string) {
  return prisma.tournament.findUnique({
    where: { id: tournamentId },
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
      categories: {
        orderBy: [{ createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          sport: true,
          gender: true,
          teamSize: true,
          level: true,
          format: true,
          status: true,
          enableSilverSeries: true,
          _count: { select: { teams: true, matches: true, bracketMatches: true } },
        },
      },
    },
  })
}

export async function getPublicCategory(categoryId: string) {
  return prisma.tournamentCategory.findUnique({
    where: { id: categoryId },
    include: {
      tournament: {
        select: { id: true, name: true, startDate: true, endDate: true, location: true, city: true, state: true },
      },
      teams: { include: { members: { include: { user: { select: { id: true, name: true, avatarUrl: true } } } } }, orderBy: [{ name: "asc" }] },
      groups: {
        orderBy: [{ position: "asc" }],
        include: { entries: { include: { team: true }, orderBy: [{ position: "asc" }] } },
      },
      standings: { include: { team: true }, orderBy: [{ series: "asc" }, { position: "asc" }] },
      matches: {
        include: { homeTeam: true, awayTeam: true, sets: true },
        orderBy: [{ phase: "asc" }, { groupId: "asc" }, { position: "asc" }],
      },
      bracketMatches: {
        include: { homeTeam: true, awayTeam: true, winnerTeam: true, match: true },
        orderBy: [{ series: "asc" }, { bracketSide: "asc" }, { round: "asc" }, { position: "asc" }],
      },
    },
  })
}

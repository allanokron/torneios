import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requirePlatformAdmin } from "@/lib/platform-admin"

export async function GET(request: Request) {
  const { response } = await requirePlatformAdmin(request)
  if (response) return response

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {}

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      state: true,
      platformRole: true,
      status: true,
      disabledReason: true,
      createdAt: true,
      subscription: { select: { status: true } },
      manualOrganizerAccess: true,
      organizerCredits: { select: { id: true, status: true, value: true, tournamentId: true } },
      _count: { select: { ownedTournaments: true, memberships: true, payments: true } },
    },
  })

  return NextResponse.json({ users })
}

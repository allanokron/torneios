import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requirePlatformAdmin } from "@/lib/platform-admin"

export async function GET(request: Request) {
  const { response } = await requirePlatformAdmin(request)
  if (response) return response

  const { searchParams } = new URL(request.url)
  const scope = searchParams.get("scope")
  const where = scope === "organizers"
    ? { type: { in: ["SUBSCRIPTION", "TOURNAMENT_EXTRA"] } }
    : scope === "athletes"
      ? { type: "REGISTRATION" }
      : {}

  const payments = await prisma.payment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      user: { select: { id: true, name: true, email: true } },
      tournament: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
      team: { select: { id: true, name: true } },
      teamMember: { select: { id: true, name: true, email: true, paymentStatus: true } },
      organizerCredit: true,
    },
  })

  return NextResponse.json({ payments })
}

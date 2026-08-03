import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requirePlatformAdmin } from "@/lib/platform-admin"

export async function GET(request: Request) {
  const { response } = await requirePlatformAdmin(request)
  if (response) return response

  const payments = await prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: 150,
    include: {
      user: { select: { id: true, name: true, email: true } },
      tournament: { select: { id: true, name: true } },
      organizerCredit: true,
    },
  })

  return NextResponse.json({ payments })
}

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requirePlatformAdmin } from "@/lib/platform-admin"

export async function GET(request: Request) {
  const { response } = await requirePlatformAdmin(request)
  if (response) return response

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      user: { select: { id: true, name: true, email: true } },
      tournament: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json({ logs })
}

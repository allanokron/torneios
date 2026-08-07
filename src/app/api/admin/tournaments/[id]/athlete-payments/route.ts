import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requirePlatformAdmin } from "@/lib/platform-admin"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { response } = await requirePlatformAdmin(request)
  if (response) return response

  const { id } = await params
  const tournament = await prisma.tournament.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      members: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: [{ user: { name: "asc" } }],
      },
      payments: {
        where: { type: "REGISTRATION" },
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!tournament) {
    return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })
  }

  return NextResponse.json({ tournament })
}

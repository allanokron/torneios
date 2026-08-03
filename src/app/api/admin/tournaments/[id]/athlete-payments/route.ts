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
      categories: {
        orderBy: [{ name: "asc" }],
        include: {
          teams: {
            orderBy: [{ name: "asc" }],
            include: {
              members: {
                include: {
                  user: { select: { id: true, name: true, email: true } },
                  payments: { orderBy: { createdAt: "desc" }, take: 1 },
                },
              },
              payments: { orderBy: { createdAt: "desc" }, take: 1 },
            },
          },
        },
      },
      payments: {
        where: { type: "REGISTRATION" },
        include: {
          user: { select: { id: true, name: true, email: true } },
          category: { select: { id: true, name: true } },
          team: { select: { id: true, name: true } },
          teamMember: { select: { id: true, name: true, email: true, paymentStatus: true } },
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

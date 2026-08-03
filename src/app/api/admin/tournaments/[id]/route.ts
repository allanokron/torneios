import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auditAdminAction, requirePlatformAdmin } from "@/lib/platform-admin"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, response } = await requirePlatformAdmin(request)
  if (response) return response

  const { id } = await params
  const body = await request.json()
  const current = await prisma.tournament.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })

  const data: Record<string, unknown> = {}
  for (const field of ["name", "description", "location", "city", "state", "status", "isPublic"]) {
    if (body[field] !== undefined) data[field] = body[field]
  }

  const tournament = await prisma.tournament.update({
    where: { id },
    data,
    include: { owner: { select: { id: true, name: true, email: true } } },
  })

  await auditAdminAction({
    adminId: admin!.id,
    action: "admin_tournament_updated",
    entityType: "Tournament",
    entityId: id,
    tournamentId: id,
    oldValue: current,
    newValue: data,
  })

  return NextResponse.json({ tournament })
}

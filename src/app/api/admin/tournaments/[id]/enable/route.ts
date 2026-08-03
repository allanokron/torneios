import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auditAdminAction, requirePlatformAdmin } from "@/lib/platform-admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, response } = await requirePlatformAdmin(request)
  if (response) return response

  const { id } = await params
  const current = await prisma.tournament.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: "Torneio não encontrado" }, { status: 404 })

  const tournament = await prisma.tournament.update({
    where: { id },
    data: { visibilityStatus: "ACTIVE", disabledAt: null, disabledReason: null },
  })

  await auditAdminAction({
    adminId: admin!.id,
    action: "admin_tournament_enabled",
    entityType: "Tournament",
    entityId: id,
    tournamentId: id,
    oldValue: { visibilityStatus: current.visibilityStatus },
    newValue: { visibilityStatus: tournament.visibilityStatus },
  })

  return NextResponse.json({ tournament })
}

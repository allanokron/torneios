import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auditAdminAction, requirePlatformAdmin } from "@/lib/platform-admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, response } = await requirePlatformAdmin(request)
  if (response) return response

  const { id } = await params
  const body = await request.json()
  const action = body.action as string
  const reason = body.reason || "Liberação manual pelo admin"

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  if (action === "enable_manual") {
    const access = await prisma.manualOrganizerAccess.upsert({
      where: { userId: id },
      create: { userId: id, enabled: true, reason, grantedBy: admin!.id, grantedAt: new Date() },
      update: { enabled: true, reason, grantedBy: admin!.id, grantedAt: new Date(), revokedAt: null },
    })
    await auditAdminAction({ adminId: admin!.id, action: "admin_manual_organizer_enabled", entityType: "User", entityId: id, newValue: access, reason })
    return NextResponse.json({ access })
  }

  if (action === "disable_manual") {
    const access = await prisma.manualOrganizerAccess.upsert({
      where: { userId: id },
      create: { userId: id, enabled: false, reason, grantedBy: admin!.id, revokedAt: new Date() },
      update: { enabled: false, reason, revokedAt: new Date() },
    })
    await auditAdminAction({ adminId: admin!.id, action: "admin_manual_organizer_disabled", entityType: "User", entityId: id, newValue: access, reason })
    return NextResponse.json({ access })
  }

  if (action === "add_credit") {
    const credits = Math.max(1, Math.min(20, Number(body.quantity || 1)))
    const created = await prisma.$transaction(
      Array.from({ length: credits }, () =>
        prisma.organizerTournamentCredit.create({
          data: { userId: id, status: "AVAILABLE", value: 0 },
        })
      )
    )
    await auditAdminAction({ adminId: admin!.id, action: "admin_manual_credits_added", entityType: "User", entityId: id, newValue: { credits }, reason })
    return NextResponse.json({ credits: created })
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 })
}

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auditAdminAction, requirePlatformAdmin } from "@/lib/platform-admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, response } = await requirePlatformAdmin(request)
  if (response) return response

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const current = await prisma.user.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  if (current.platformRole === "OWNER" && current.id === admin!.id) {
    return NextResponse.json({ error: "O dono não pode desativar a própria conta" }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { status: "DISABLED", disabledAt: new Date(), disabledReason: body.reason || "Desativado pelo admin" },
  })

  await auditAdminAction({
    adminId: admin!.id,
    action: "admin_user_disabled",
    entityType: "User",
    entityId: id,
    oldValue: { status: current.status },
    newValue: { status: updated.status, disabledReason: updated.disabledReason },
    reason: body.reason,
  })

  return NextResponse.json({ user: updated })
}

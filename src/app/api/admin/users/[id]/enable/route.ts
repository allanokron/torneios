import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auditAdminAction, requirePlatformAdmin } from "@/lib/platform-admin"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, response } = await requirePlatformAdmin(request)
  if (response) return response

  const { id } = await params
  const current = await prisma.user.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  const updated = await prisma.user.update({
    where: { id },
    data: { status: "ACTIVE", disabledAt: null, disabledReason: null },
  })

  await auditAdminAction({
    adminId: admin!.id,
    action: "admin_user_enabled",
    entityType: "User",
    entityId: id,
    oldValue: { status: current.status },
    newValue: { status: updated.status },
  })

  return NextResponse.json({ user: updated })
}

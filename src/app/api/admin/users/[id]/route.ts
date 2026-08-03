import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { auditAdminAction, requirePlatformAdmin } from "@/lib/platform-admin"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { admin, response } = await requirePlatformAdmin(request)
  if (response) return response

  const { id } = await params
  const body = await request.json()
  const current = await prisma.user.findUnique({ where: { id } })
  if (!current) return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })

  const data: Record<string, unknown> = {}
  for (const field of ["name", "phone", "city", "state", "gameLevel", "dominantHand"]) {
    if (body[field] !== undefined) data[field] = body[field] || null
  }
  if (body.platformRole !== undefined && ["USER", "ADMIN", "OWNER"].includes(body.platformRole)) {
    data.platformRole = body.platformRole
  }

  const updated = await prisma.user.update({
    where: { id },
    data,
    select: { id: true, name: true, email: true, platformRole: true, status: true },
  })

  await auditAdminAction({
    adminId: admin!.id,
    action: "admin_user_updated",
    entityType: "User",
    entityId: id,
    oldValue: current,
    newValue: data,
  })

  return NextResponse.json({ user: updated })
}

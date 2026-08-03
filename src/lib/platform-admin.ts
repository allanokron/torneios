import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/auth"
import type { Prisma } from "@/generated/prisma/client"

export type PlatformAdmin = {
  id: string
  name: string
  email: string
  platformRole: string
}

export async function getPlatformAdmin(request: Request): Promise<PlatformAdmin | null> {
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const decoded = verifyToken(authHeader.split(" ")[1])
  if (!decoded) return null

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: { id: true, name: true, email: true, platformRole: true, status: true },
  })

  if (!user || user.status !== "ACTIVE") return null
  if (user.platformRole !== "ADMIN" && user.platformRole !== "OWNER") return null

  return user
}

export async function requirePlatformAdmin(request: Request) {
  const admin = await getPlatformAdmin(request)
  if (!admin) {
    return {
      admin: null,
      response: NextResponse.json({ error: "Acesso negado" }, { status: 403 }),
    }
  }

  return { admin, response: null }
}

export async function isPlatformAdminUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { platformRole: true, status: true },
  })

  return Boolean(user?.status === "ACTIVE" && (user.platformRole === "ADMIN" || user.platformRole === "OWNER"))
}

export async function canManageTournament(userId: string, ownerId: string) {
  if (ownerId === userId) return true
  return isPlatformAdminUser(userId)
}

export async function auditAdminAction(input: {
  adminId: string
  action: string
  entityType: string
  entityId?: string | null
  oldValue?: unknown
  newValue?: unknown
  reason?: string | null
  tournamentId?: string | null
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.adminId,
      tournamentId: input.tournamentId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      oldValue: input.oldValue == null ? undefined : input.oldValue as Prisma.InputJsonValue,
      newValue: input.newValue == null ? undefined : input.newValue as Prisma.InputJsonValue,
      reason: input.reason ?? null,
    },
  })
}

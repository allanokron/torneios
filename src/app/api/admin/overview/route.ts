import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { requirePlatformAdmin } from "@/lib/platform-admin"

export async function GET(request: Request) {
  const { response } = await requirePlatformAdmin(request)
  if (response) return response

  const [
    totalUsers,
    activeUsers,
    disabledUsers,
    totalTournaments,
    activeTournaments,
    disabledTournaments,
    inProgressTournaments,
    finishedTournaments,
    manualOrganizers,
    activeSubscriptions,
    inactiveSubscriptions,
    availableCredits,
    usedCredits,
    paidPayments,
    pendingPayments,
    recentUsers,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { status: "ACTIVE" } }),
    prisma.user.count({ where: { status: "DISABLED" } }),
    prisma.tournament.count(),
    prisma.tournament.count({ where: { visibilityStatus: "ACTIVE" } }),
    prisma.tournament.count({ where: { visibilityStatus: "DISABLED" } }),
    prisma.tournament.count({ where: { status: "in_progress" } }),
    prisma.tournament.count({ where: { status: "finished" } }),
    prisma.manualOrganizerAccess.count({ where: { enabled: true } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: { not: "ACTIVE" } } }),
    prisma.organizerTournamentCredit.count({ where: { status: "AVAILABLE" } }),
    prisma.organizerTournamentCredit.count({ where: { status: "USED" } }),
    prisma.payment.count({ where: { status: "PAID" } }),
    prisma.payment.count({ where: { status: { in: ["PENDING", "AWAITING_PIX"] } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: { id: true, name: true, email: true, platformRole: true, status: true, createdAt: true },
    }),
    prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ])

  return NextResponse.json({
    stats: {
      totalUsers,
      activeUsers,
      disabledUsers,
      totalTournaments,
      activeTournaments,
      disabledTournaments,
      inProgressTournaments,
      finishedTournaments,
      manualOrganizers,
      activeSubscriptions,
      inactiveSubscriptions,
      availableCredits,
      usedCredits,
      paidPayments,
      pendingPayments,
    },
    recentUsers,
    recentAuditLogs,
  })
}

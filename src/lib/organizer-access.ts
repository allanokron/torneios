import prisma from "@/lib/prisma"

export const DEFAULT_ORGANIZER_PLAN = {
  code: "monthly_unlimited",
  name: "Organizador Mensal",
  description: "Criação ilimitada de torneios enquanto a assinatura estiver ativa.",
  monthlyValue: 990,
  tournamentLimit: null as number | null,
  features: {
    unlimitedTournaments: true,
    publicTournamentLinks: true,
    categoryManagement: true,
  },
}

export const SINGLE_TOURNAMENT_CREDIT_VALUE = 4990

export async function ensureDefaultOrganizerPlan() {
  return prisma.organizerPlan.upsert({
    where: { code: DEFAULT_ORGANIZER_PLAN.code },
    create: DEFAULT_ORGANIZER_PLAN,
    update: {
      name: DEFAULT_ORGANIZER_PLAN.name,
      description: DEFAULT_ORGANIZER_PLAN.description,
      monthlyValue: DEFAULT_ORGANIZER_PLAN.monthlyValue,
      tournamentLimit: DEFAULT_ORGANIZER_PLAN.tournamentLimit,
      features: DEFAULT_ORGANIZER_PLAN.features,
      isActive: true,
    },
  })
}

export async function getOrganizerAccess(userId: string) {
  const [subscription, manualAccess, availableCredit, ownedTournaments] = await Promise.all([
    prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    }),
    prisma.manualOrganizerAccess.findUnique({
      where: { userId },
    }),
    prisma.organizerTournamentCredit.findFirst({
      where: { userId, status: "AVAILABLE" },
      orderBy: { createdAt: "asc" },
    }),
    prisma.tournament.count({ where: { ownerId: userId } }),
  ])

  const hasActiveSubscription = subscription?.status === "ACTIVE"
  const hasManualAccess = Boolean(manualAccess?.enabled)
  const canCreateTournament = hasActiveSubscription || hasManualAccess || Boolean(availableCredit)
  const reason = hasActiveSubscription
    ? "active_subscription"
    : hasManualAccess
      ? "manual_access"
    : availableCredit
      ? "available_credit"
      : "no_access"

  return {
    canCreateTournament,
    reason,
    subscription,
    manualAccess,
    availableCredit,
    ownedTournaments,
  }
}

export async function consumeOrganizerCreditIfNeeded(userId: string, tournamentId: string) {
  const access = await getOrganizerAccess(userId)
  if (access.subscription?.status === "ACTIVE") return null
  if (access.manualAccess?.enabled) return null
  if (!access.availableCredit) return null

  return prisma.organizerTournamentCredit.update({
    where: { id: access.availableCredit.id },
    data: {
      status: "USED",
      tournamentId,
      usedAt: new Date(),
    },
  })
}

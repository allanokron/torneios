import "dotenv/config"
import prisma from "../src/lib/prisma"

const confirm = process.argv.includes("--confirm")
const keepPattern = "SOLARIS"

async function main() {
  const tournaments = await prisma.tournament.findMany({
    where: {
      NOT: {
        name: {
          contains: keepPattern,
          mode: "insensitive",
        },
      },
    },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      _count: {
        select: {
          members: true,
          matches: true,
          payments: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  console.log(`Preservando torneios cujo nome contenha "${keepPattern}".`)
  console.table(
    tournaments.map((tournament) => ({
      id: tournament.id,
      name: tournament.name,
      status: tournament.status,
      members: tournament._count.members,
      matches: tournament._count.matches,
      payments: tournament._count.payments,
      createdAt: tournament.createdAt.toISOString(),
    }))
  )

  if (!confirm) {
    console.log("\nPrévia apenas. Para apagar estes torneios, rode novamente com --confirm.")
    return
  }

  const hasPayments = tournaments.some((tournament) => tournament._count.payments > 0)
  if (hasPayments) {
    console.log("\nLimpeza abortada: existe torneio alvo com pagamento vinculado. Nenhum dado foi apagado.")
    return
  }

  const tournamentIds = tournaments.map((tournament) => tournament.id)
  const result = await prisma.tournament.deleteMany({ where: { id: { in: tournamentIds } } })

  console.log(`\nTorneios removidos: ${result.count}`)
}

main()
  .catch((error) => {
    console.error("Erro na limpeza:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

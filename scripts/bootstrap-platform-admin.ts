import "dotenv/config"
import prisma from "../src/lib/prisma"
import { hashPassword } from "../src/lib/auth"

async function main() {
  const passwordHash = await hashPassword("123456")
  const user = await prisma.user.upsert({
    where: { email: "admin@email.com" },
    update: {
      name: "Admin Torneio+",
      passwordHash,
      platformRole: "OWNER",
      status: "ACTIVE",
      disabledAt: null,
      disabledReason: null,
    },
    create: {
      email: "admin@email.com",
      name: "Admin Torneio+",
      passwordHash,
      platformRole: "OWNER",
      status: "ACTIVE",
      profile: { create: {} },
    },
  })

  console.log(`Admin pronto: ${user.email}`)
}

main()
  .catch((error) => {
    console.error("Erro ao criar admin:", error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

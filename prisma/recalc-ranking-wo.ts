import 'dotenv/config'
import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const TOURNAMENT_ID = "cms3n9osv000nh4vgpc8o997p"

async function main() {
  console.log("🔄 Updating W.O. stats in PlayerRanking rows...")

  const rankings = await prisma.playerRanking.findMany({
    where: { tournamentId: TOURNAMENT_ID },
    include: { user: { select: { name: true } } },
  })

  for (const r of rankings) {
    if (r.winsByWO > 0 || r.lossesByWO > 0) {
      const woPtsWon = r.winsByWO * 3
      const woPtsLost = r.lossesByWO * 0
      const woSetsWon = r.winsByWO * 2
      const woSetsLost = r.lossesByWO * 0
      const woGamesWon = r.winsByWO * 12
      const woGamesLost = r.lossesByWO * 0

      await prisma.playerRanking.update({
        where: { id: r.id },
        data: {
          woPointsWon: woPtsWon,
          woPointsLost: woPtsLost,
          woSetsWon,
          woSetsLost,
          woGamesWon,
          woGamesLost,
        },
      })
      console.log(`  ${r.user.name}: WO wins=${r.winsByWO} WO losses=${r.lossesByWO} → +${woPtsWon}pts, ${woSetsWon}S/${woSetsLost}S, ${woGamesWon}G/${woGamesLost}G`)
    }
  }

  console.log("\n✅ W.O. stats populados com sucesso!")
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())

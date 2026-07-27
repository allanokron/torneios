import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const TOURNAMENT_ID = 'cms3n9osv000nh4vgpc8o997p';

async function main() {
  // 1. Find all W.O. matches that have status='finished' instead of 'wo'
  const woMatches = await prisma.match.findMany({
    where: {
      tournamentId: TOURNAMENT_ID,
      endReason: 'wo',
      status: 'finished',
    },
    include: { homePlayer: true, awayPlayer: true, sets: true },
  });

  console.log(`📋 Encontrados ${woMatches.length} jogos W.O. com status 'finished' (deveria ser 'wo'):\n`);

  for (const m of woMatches) {
    const winnerName = m.winnerId === m.homePlayerId ? m.homePlayer.name : m.awayPlayer.name;
    const loserName = m.winnerId === m.homePlayerId ? m.awayPlayer.name : m.homePlayer.name;
    console.log(`  ${m.homePlayer.name} vs ${m.awayPlayer.name} | Winner: ${winnerName} | Month: ${m.month} | Round: ${m.round}`);
  }

  // 2. Update all W.O. matches to status='wo'
  const result = await prisma.match.updateMany({
    where: {
      tournamentId: TOURNAMENT_ID,
      endReason: 'wo',
      status: 'finished',
    },
    data: {
      status: 'wo',
    },
  });

  console.log(`\n✅ ${result.count} jogos W.O. atualizados de 'finished' para 'wo'`);

  // 3. Verify
  const verifyCount = await prisma.match.count({
    where: { tournamentId: TOURNAMENT_ID, status: 'wo' },
  });
  console.log(`📊 Total de jogos W.O. no banco: ${verifyCount}`);

  await prisma.$disconnect();
  console.log('\n✨ Concluído! Agora recalculando ranking...');
}

main().catch(console.error);

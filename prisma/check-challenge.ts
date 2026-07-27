import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const match = await prisma.match.findFirst({
    where: { round: 'Desafio', isChallenge: true },
    include: { homePlayer: true, awayPlayer: true }
  });

  if (!match) { console.log('Match not found'); return; }

  console.log('Match found:');
  console.log('  ID:', match.id);
  console.log('  Home:', match.homePlayer.name, '(' + match.homePlayerId + ')');
  console.log('  Away:', match.awayPlayer.name, '(' + match.awayPlayerId + ')');
  console.log('  Status:', match.status);
  console.log('  Winner:', match.winnerId);
  console.log('  isChallenge:', match.isChallenge);
  console.log('  challengePositionHome:', match.challengePositionHome);
  console.log('  challengePositionAway:', match.challengePositionAway);
  console.log('  challengePoints:', match.challengePoints);
  console.log('  challengePointsChallenged:', match.challengePointsChallenged);

  const rankings = await prisma.playerRanking.findMany({
    where: { tournamentId: match.tournamentId },
    orderBy: { position: 'asc' },
    include: { user: true }
  });

  console.log('\nCurrent ranking:');
  for (const r of rankings) {
    console.log('  #' + r.position + ' ' + r.user.name + ' (' + r.points + ' pts) id=' + r.userId);
  }

  await prisma.$disconnect();
}
main();

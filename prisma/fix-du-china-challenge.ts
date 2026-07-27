import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const TOURNAMENT_ID = 'cms3n9osv000nh4vgpc8o997p';
const DU_ID = 'cms3n9krv0006h4vgpid8z14r';
const CHINA_ID = 'cms3n9k8n0004h4vgvhl33zdy';

async function main() {
  // 1. Find the challenge match
  const match = await prisma.match.findFirst({
    where: { round: 'Desafio', isChallenge: true, tournamentId: TOURNAMENT_ID },
  });

  if (!match) { console.log('❌ Match not found'); return; }

  console.log('📋 Match:', match.id);
  console.log('   DU (home):', match.homePlayerId);
  console.log('   CHINA (away):', match.awayPlayerId);
  console.log('   Winner:', match.winnerId);

  // 2. Update match with challenge positions and points
  // DU was 5 positions behind CHINA (positionDiff = 5)
  // basePoints = 5 * 50 = 250
  // DU won → challengerPoints = 250, challengedPoints = 0
  const positionDiff = 5;
  const duPosition = 10; // DU was at position 10
  const chinaPosition = 5; // CHINA was at position 5

  await prisma.match.update({
    where: { id: match.id },
    data: {
      challengePositionHome: duPosition,
      challengePositionAway: chinaPosition,
      challengePoints: 250,
      challengePointsChallenged: 0,
      challengeReferenceMonth: '03/2026',
    },
  });

  console.log('\n✅ Match atualizado:');
  console.log('   challengePositionHome (DU):', duPosition);
  console.log('   challengePositionAway (CHINA):', chinaPosition);
  console.log('   challengePoints (DU): 250');
  console.log('   challengePointsChallenged (CHINA): 0');

  // 3. Update DU's PlayerRanking
  const duRanking = await prisma.playerRanking.findUnique({
    where: { tournamentId_userId: { tournamentId: TOURNAMENT_ID, userId: DU_ID } },
  });

  if (duRanking) {
    await prisma.playerRanking.update({
      where: { id: duRanking.id },
      data: {
        challengePoints: { increment: 250 },
        challengeMatches: { increment: 1 },
        challengeWins: { increment: 1 },
      },
    });
    console.log('\n✅ DU ranking atualizado: +250 challengePoints, +1 challengeMatch, +1 challengeWin');
  } else {
    console.log('\n⚠️ DU ranking não encontrado, criando...');
    await prisma.playerRanking.create({
      data: {
        tournamentId: TOURNAMENT_ID,
        userId: DU_ID,
        position: 8,
        points: 2360 + 250,
        basePoints: 0,
        matchesPlayed: 17,
        wins: 14,
        losses: 3,
        winsByWO: 0,
        lossesByWO: 0,
        setsWon: 31,
        setsLost: 8,
        gamesWon: 210,
        gamesLost: 82,
        matchPoints: 2360,
        setBalance: 23,
        gamesBalance: 128,
        challengePoints: 250,
        challengeMatches: 1,
        challengeWins: 1,
        challengeLosses: 0,
      },
    });
  }

  // 4. Update CHINA's PlayerRanking (0 points from challenge)
  const chinaRanking = await prisma.playerRanking.findUnique({
    where: { tournamentId_userId: { tournamentId: TOURNAMENT_ID, userId: CHINA_ID } },
  });

  if (chinaRanking) {
    await prisma.playerRanking.update({
      where: { id: chinaRanking.id },
      data: {
        challengePoints: { increment: 0 },
        challengeMatches: { increment: 1 },
        challengeLosses: { increment: 1 },
      },
    });
    console.log('✅ CHINA ranking atualizado: +0 challengePoints, +1 challengeMatch, +1 challengeLoss');
  }

  // 5. Verify
  console.log('\n📊 Verificação final:');
  const matchAfter = await prisma.match.findUnique({ where: { id: match.id } });
  console.log('   Match challengePoints:', matchAfter?.challengePoints);
  console.log('   Match challengePointsChallenged:', matchAfter?.challengePointsChallenged);
  console.log('   Match challengePositionHome:', matchAfter?.challengePositionHome);
  console.log('   Match challengePositionAway:', matchAfter?.challengePositionAway);

  const duAfter = await prisma.playerRanking.findUnique({
    where: { tournamentId_userId: { tournamentId: TOURNAMENT_ID, userId: DU_ID } },
  });
  const chinaAfter = await prisma.playerRanking.findUnique({
    where: { tournamentId_userId: { tournamentId: TOURNAMENT_ID, userId: CHINA_ID } },
  });
  console.log('   DU challengePoints:', duAfter?.challengePoints);
  console.log('   CHINA challengePoints:', chinaAfter?.challengePoints);

  await prisma.$disconnect();
  console.log('\n✨ Concluído! Recalculando ranking...');
}

main().catch(console.error);

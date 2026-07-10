import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Data from the ranking image: CIRCUITO SOCIAL TENIS - RANKING
const players = [
  { name: 'CHRISTIAN', points: 2770, wins: 14, setsWon: 27, gamesWon: 128, winsByWO: 0, delays: 0 },
  { name: 'THIAGO', points: 2710, wins: 14, setsWon: 25, gamesWon: 101, winsByWO: 0, delays: 1 },
  { name: 'JANICE', points: 2500, wins: 12, setsWon: 20, gamesWon: 101, winsByWO: 0, delays: 1 },
  { name: 'DU', points: 2440, wins: 11, setsWon: 11, gamesWon: 39, winsByWO: 1, delays: 2 },
  { name: 'EDSON', points: 2370, wins: 11, setsWon: 19, gamesWon: 63, winsByWO: 0, delays: 2 },
  { name: 'GUSTAVO', points: 2330, wins: 10, setsWon: 12, gamesWon: 36, winsByWO: 0, delays: 0 },
  { name: 'SAMUEL', points: 2210, wins: 10, setsWon: 8, gamesWon: 50, winsByWO: 0, delays: 0 },
  { name: 'CARLOS', points: 2030, wins: 8, setsWon: 7, gamesWon: 43, winsByWO: 0, delays: 0 },
  { name: 'EVERTON', points: 1960, wins: 9, setsWon: 10, gamesWon: 23, winsByWO: 0, delays: 1 },
  { name: 'ALEX', points: 1960, wins: 9, setsWon: 4, gamesWon: 21, winsByWO: 0, delays: 0 },
  { name: 'MURILO', points: 1870, wins: 9, setsWon: 10, gamesWon: 48, winsByWO: 0, delays: 1 },
  { name: 'STEFAN', points: 1720, wins: 8, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 0 },
  { name: 'CHINA', points: 1720, wins: 7, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 2 },
  { name: 'ALINE', points: 1690, wins: 7, setsWon: 0, gamesWon: 3, winsByWO: 0, delays: 0 },
  { name: 'ULYSSES', points: 1660, wins: 7, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 0 },
  { name: 'LUKINHA', points: 1660, wins: 6, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 0 },
  { name: 'EZEQUIAS', points: 1620, wins: 5, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 0 },
  { name: 'CID', points: 1340, wins: 5, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 3 },
  { name: 'BONA', points: 860, wins: 2, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 1 },
  { name: 'LUIZ', points: 830, wins: 2, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 0 },
  { name: 'GIULIA', points: 740, wins: 2, setsWon: 0, gamesWon: 0, winsByWO: 4, delays: 3 },
  { name: 'JOAO GABRIEL', points: 590, wins: 1, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 1 },
  { name: 'NICELIO', points: 560, wins: 1, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 0 },
  { name: 'MARCOS', points: 470, wins: 2, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 0 },
  { name: 'GUILHERME', points: 370, wins: 0, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 1 },
  { name: 'MATHEUS', points: 0, wins: 0, setsWon: 0, gamesWon: 0, winsByWO: 0, delays: 0 },
];

// Map from display name to full name and email
function getEmail(name: string): string {
  const map: Record<string, string> = {
    'CHRISTIAN': 'christian@email.com',
    'THIAGO': 'thiago@email.com',
    'JANICE': 'janice@email.com',
    'DU': 'du@email.com',
    'EDSON': 'edson@email.com',
    'GUSTAVO': 'gustavo@email.com',
    'SAMUEL': 'samuel@email.com',
    'CARLOS': 'carlos@email.com',
    'EVERTON': 'everton@email.com',
    'ALEX': 'ale@email.com',
    'MURILO': 'murilo@email.com',
    'STEFAN': 'stefan@email.com',
    'CHINA': 'china@email.com',
    'ALINE': 'aline@email.com',
    'ULYSSES': 'ulysses@email.com',
    'LUKINHA': 'lukinha@email.com',
    'EZEQUIAS': 'ezequias@email.com',
    'CID': 'cid@email.com',
    'BONA': 'bona@email.com',
    'LUIZ': 'luiz@email.com',
    'GIULIA': 'giulia@email.com',
    'JOAO GABRIEL': 'joaogabriel@email.com',
    'NICELIO': 'nicelio@email.com',
    'MARCOS': 'marcos@email.com',
    'GUILHERME': 'guilherme@email.com',
    'MATHEUS': 'matheus@email.com',
  };
  return map[name] || `${name.toLowerCase().replace(/\s+/g, '')}@email.com`;
}

function getFullName(name: string): string {
  const map: Record<string, string> = {
    'CHRISTIAN': 'Christian',
    'THIAGO': 'Thiago',
    'JANICE': 'Janice',
    'DU': 'Du',
    'EDSON': 'Edson',
    'GUSTAVO': 'Gustavo',
    'SAMUEL': 'Samuel',
    'CARLOS': 'Carlos',
    'EVERTON': 'Everton',
    'ALEX': 'Alê',
    'MURILO': 'Murilo',
    'STEFAN': 'Stefan',
    'CHINA': 'China',
    'ALINE': 'Aline',
    'ULYSSES': 'Ulysses',
    'LUKINHA': 'Lukinha',
    'EZEQUIAS': 'Ezequias',
    'CID': 'Cid',
    'BONA': 'Bona',
    'LUIZ': 'Luiz',
    'GIULIA': 'Giulia',
    'JOAO GABRIEL': 'João Gabriel',
    'NICELIO': 'Nicélio',
    'MARCOS': 'Marcos',
    'GUILHERME': 'Guilherme',
    'MATHEUS': 'Matheus',
  };
  return map[name] || name;
}

async function main() {
  console.log('🎾 Seeding ranking data for Solaris tournament...\n');

  // Find the Solaris tournament
  const tournament = await prisma.tournament.findFirst({
    where: { name: { contains: 'Solaris', mode: 'insensitive' } },
  });
  if (!tournament) {
    console.error('❌ Tournament "Ranking Solaris" not found!');
    process.exit(1);
  }
  console.log(`✅ Found tournament: ${tournament.name} (${tournament.id})`);

  const passwordHash = await bcrypt.hash('123456', 12);

  let created = 0;
  let skipped = 0;

  for (const player of players) {
    const email = getEmail(player.name);
    const fullName = getFullName(player.name);

    // Check if user already exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: fullName,
          passwordHash,
        },
      });
      created++;
      console.log(`  ✅ Created user: ${fullName} (${email})`);
    } else {
      skipped++;
      console.log(`  ⏭️  User exists: ${fullName} (${email})`);
    }

    // Add as tournament member if not already
    const existingMember = await prisma.tournamentMember.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: user.id } },
    });

    if (!existingMember) {
      await prisma.tournamentMember.create({
        data: {
          tournamentId: tournament.id,
          userId: user.id,
          role: 'player',
          status: 'accepted',
          joinedAt: new Date(),
        },
      });
    }

    // Create or update PlayerRanking
    const matchesPlayed = player.wins + Math.floor(player.wins * 0.8); // approximate losses
    const losses = Math.max(0, matchesPlayed - player.wins);

    // Calculate set balance from wins
    const setBalance = player.setsWon;

    await prisma.playerRanking.upsert({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: user.id } },
      create: {
        tournamentId: tournament.id,
        userId: user.id,
        position: players.indexOf(player) + 1,
        points: player.points,
        matchesPlayed: player.wins + losses,
        wins: player.wins,
        losses,
        winsByWO: player.winsByWO,
        lossesByWO: 0,
        setsWon: player.setsWon,
        setsLost: Math.max(0, player.setsWon - setBalance),
        gamesWon: player.gamesWon,
        gamesLost: Math.max(0, player.gamesWon - Math.abs(player.gamesWon) + 50),
        setBalance,
        gamesBalance: player.gamesWon,
      },
      update: {
        position: players.indexOf(player) + 1,
        points: player.points,
        wins: player.wins,
        winsByWO: player.winsByWO,
        setsWon: player.setsWon,
        gamesWon: player.gamesWon,
        setBalance,
        gamesBalance: player.gamesWon,
      },
    });
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Users created: ${created}`);
  console.log(`   Users skipped: ${skipped}`);
  console.log(`   Total players: ${players.length}`);
  console.log(`\n🔑 All players can login with: email / 123456`);
  console.log('\n✨ Done!');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

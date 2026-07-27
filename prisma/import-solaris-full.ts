import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const emailMap: Record<string, string> = {
  'ALINE': 'aline@email.com', 'ALÊ': 'ale@email.com', 'BONA': 'bona@email.com',
  'CARLOS': 'carlos@email.com', 'CHINA': 'china@email.com', 'CHRISTIAN': 'christian@email.com',
  'CID': 'cid@email.com', 'DU': 'du@email.com', 'EDSON': 'edson@email.com',
  'EVERTON': 'everton@email.com', 'EZEQUIAS': 'ezequias@email.com', 'GIULIA': 'giulia@email.com',
  'GUILHERME': 'guilherme@email.com', 'GUSTAVO': 'gustavo@email.com', 'JANICE': 'janice@email.com',
  'JOAO GABRIEL': 'joaogabriel@email.com', 'LUIZ': 'luiz@email.com', 'LUKINHA': 'lukinha@email.com',
  'MURILO': 'murilo@email.com', 'NICELIO': 'nicelio@email.com', 'SAMUEL': 'samuel@email.com',
  'STEFAN': 'stefan@email.com', 'THIAGO': 'thiago@email.com', 'ULYSSES': 'ulysses@email.com',
  'MARCOS': 'marcos@email.com', 'MATHEUS': 'matheus@email.com',
};

const fullNameMap: Record<string, string> = {
  'ALINE': 'Aline', 'ALÊ': 'Alê', 'BONA': 'Bona', 'CARLOS': 'Carlos',
  'CHINA': 'China', 'CHRISTIAN': 'Christian', 'CID': 'Cid', 'DU': 'Du',
  'EDSON': 'Edson', 'EVERTON': 'Everton', 'EZEQUIAS': 'Ezequias', 'GIULIA': 'Giulia',
  'GUILHERME': 'Guilherme', 'GUSTAVO': 'Gustavo', 'JANICE': 'Janice',
  'JOAO GABRIEL': 'João Gabriel', 'LUIZ': 'Luiz', 'LUKINHA': 'Lukinha',
  'MURILO': 'Murilo', 'NICELIO': 'Nicélio', 'SAMUEL': 'Samuel', 'STEFAN': 'Stefan',
  'THIAGO': 'Thiago', 'ULYSSES': 'Ulysses', 'MARCOS': 'Marcos', 'MATHEUS': 'Matheus',
};

const monthMap: Record<string, number> = {
  'jan': 0, 'fev': 1, 'mar': 2, 'abr': 3, 'mai': 4, 'jun': 5,
  'jul': 6, 'ago': 7, 'set': 8, 'out': 9, 'nov': 10, 'dez': 11,
};

function parseDate(dateStr: string, monthCol: string): Date | null {
  if (!dateStr || dateStr === '' || dateStr === 'ADIAMENTO' || dateStr === 'CHUVA' ||
      dateStr === 'Chuva' || dateStr.startsWith('Jogar até') || dateStr.startsWith('Até') ||
      dateStr === 'W.O.' || dateStr.startsWith('Adiamento')) {
    return null;
  }

  const match = dateStr.match(/(\d{1,2})-(\w+\.?)/);
  if (match) {
    const day = parseInt(match[1]);
    const monthStr = match[2].replace('.', '');
    const monthNum = monthMap[monthStr];
    if (monthNum !== undefined) {
      const [colMonth, colYear] = monthCol.split('/');
      return new Date(parseInt(colYear), monthNum, day);
    }
  }
  return null;
}

function parseTime(timeStr: string): string | null {
  if (!timeStr || timeStr === '' || timeStr === 'ADIAMENTO' || timeStr === 'CHUVA' ||
      timeStr === 'Chuva' || timeStr.startsWith('Jogar até') || timeStr.startsWith('Até') ||
      timeStr === 'W.O.' || timeStr.startsWith('Adiamento')) {
    return null;
  }
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    return `${match[1].padStart(2, '0')}:${match[2]}`;
  }
  return null;
}

interface ParsedMatch {
  month: string;
  round: string;
  dateStr: string;
  timeStr: string;
  player1: string;
  sets1: (number | string)[];
  player2: string;
  sets2: (number | string)[];
  tabela1: boolean;
  tabela2: boolean;
  desafio1: boolean;
  desafio2: boolean;
  isWO: boolean;
  isChallenge: boolean;
}

async function main() {
  console.log('🎾 Importando dados completos do torneio Solaris...\n');

  // 1. Find tournament
  const tournament = await prisma.tournament.findFirst({
    where: { name: { contains: 'Solaris', mode: 'insensitive' } },
  });
  if (!tournament) {
    console.error('❌ Torneio "Solaris" não encontrado!');
    process.exit(1);
  }
  console.log(`✅ Torneio encontrado: ${tournament.name} (${tournament.id})`);

  // 2. Find court
  const court = await prisma.court.findFirst({
    where: { tournamentId: tournament.id },
  });
  if (!court) {
    console.error('❌ Quadra não encontrada!');
    process.exit(1);
  }
  console.log(`✅ Quadra encontrada: ${court.name}`);

  // 3. Delete existing matches
  console.log('\n🗑️  Limpando jogos existentes...');
  await prisma.match.deleteMany({ where: { tournamentId: tournament.id } });
  console.log('  ✅ Jogos antigos removidos');

  // 4. Create new users (MARCOS, MATHEUS)
  console.log('\n👤 Criando participantes novos...');
  const passwordHash = await bcrypt.hash('123456', 12);
  const userMap: Record<string, string> = {};

  // First, load all existing users
  const existingUsers = await prisma.user.findMany();
  for (const u of existingUsers) {
    const nameEntry = Object.entries(emailMap).find(([_, email]) => email === u.email);
    if (nameEntry) {
      userMap[nameEntry[0]] = u.id;
    }
  }

  // Create missing users
  for (const [name, email] of Object.entries(emailMap)) {
    if (userMap[name]) continue;

    const user = await prisma.user.create({
      data: {
        email,
        name: fullNameMap[name] || name,
        passwordHash,
      },
    });
    userMap[name] = user.id;
    console.log(`  ✅ Criado: ${fullNameMap[name]} (${email})`);
  }

  // 5. Add new members to tournament
  console.log('\n👥 Verificando participantes do torneio...');
  for (const [name, userId] of Object.entries(userMap)) {
    const existing = await prisma.tournamentMember.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId } },
    });
    if (!existing) {
      await prisma.tournamentMember.create({
        data: {
          tournamentId: tournament.id,
          userId,
          role: 'player',
          status: 'accepted',
          joinedAt: new Date(),
        },
      });
      console.log(`  ✅ Adicionado ao torneio: ${fullNameMap[name]}`);
    }
  }

  // 6. Parse CSV
  console.log('\n📄 Parseando CSV...');
  const csvPath = path.join(__dirname, '..', 'solaris_matches.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(l => l.trim());

  // Skip header
  const dataLines = lines.slice(1);

  // Parse into pairs
  const matches: ParsedMatch[] = [];
  for (let i = 0; i < dataLines.length; i += 2) {
    const line1 = dataLines[i];
    const line2 = dataLines[i + 1];
    if (!line1 || !line2) break;

    const cols1 = line1.split('\t');
    const cols2 = line2.split('\t');

    const month = cols1[0]?.trim() || '';
    const round1 = cols1[1]?.trim() || '';
    const round2 = cols2[1]?.trim() || '';
    const dateStr = cols1[2]?.trim() || '';
    const timeStr = cols2[2]?.trim() || '';
    const player1 = cols1[3]?.trim() || '';
    const player2 = cols2[3]?.trim() || '';

    // Parse sets
    const sets1: (number | string)[] = [];
    const sets2: (number | string)[] = [];

    for (let s = 4; s <= 6; s++) {
      const v1 = cols1[s]?.trim() || '';
      const v2 = cols2[s]?.trim() || '';
      if (v1 === 'W.O.') sets1.push('W.O.');
      else if (v1 !== '') sets1.push(parseInt(v1));
      if (v2 === 'W.O.') sets2.push('W.O.');
      else if (v2 !== '') sets2.push(parseInt(v2));
    }

    // Tabela column (index 7)
    const tabela1 = cols1[7]?.trim() === '1';
    const tabela2 = cols2[7]?.trim() === '1';

    // Desafio column (index 8)
    const desafio1 = cols1[8]?.trim() === '1';
    const desafio2 = cols2[8]?.trim() === '1';

    const isWO = sets1[0] === 'W.O.' || sets2[0] === 'W.O.';
    const isRound = round1.startsWith('DESAFIANTE') || round1.startsWith('DESAFIADO') ||
                    round2.startsWith('DESAFIANTE') || round2.startsWith('DESAFIADO');
    const isChallenge = desafio1 || isRound;

    const round = round1.startsWith('DESAFIANTE') || round1.startsWith('DESAFIADO') ? 'Desafio' : round1;

    matches.push({
      month, round, dateStr, timeStr,
      player1, sets1, player2, sets2,
      tabela1, tabela2, desafio1, desafio2,
      isWO, isChallenge,
    });
  }

  console.log(`  ✅ ${matches.length} jogos parseados`);

  // 7. Create matches
  console.log('\n🎮 Criando jogos...');
  let created = 0;
  let skipped = 0;
  const now = new Date();

  for (const m of matches) {
    const homeId = userMap[m.player1];
    const awayId = userMap[m.player2];

    if (!homeId || !awayId) {
      console.log(`  ❌ Jogador não encontrado: ${m.player1} ou ${m.player2}`);
      skipped++;
      continue;
    }

    // Determine if this match has results
    const hasResults = m.sets1.length > 0 && m.sets2.length > 0 &&
      !(m.sets1.length === 0 && m.sets2.length === 0);

    // Parse date
    let scheduledAt: Date | null = null;
    const parsedDate = parseDate(m.dateStr, m.month);
    const time = parseTime(m.timeStr);

    if (parsedDate && time) {
      const [h, min] = time.split(':').map(Number);
      scheduledAt = new Date(parsedDate);
      scheduledAt.setHours(h, min, 0, 0);
    } else if (parsedDate) {
      scheduledAt = new Date(parsedDate);
      scheduledAt.setHours(12, 0, 0, 0);
    }

    // Determine status
    let status = 'pending_scheduling';

    if (m.isWO) {
      // W.O. matches are always finished
      status = 'finished';
    } else if (hasResults) {
      if (scheduledAt && scheduledAt > now) {
        status = 'scheduled';
      } else if (scheduledAt) {
        status = 'finished';
      } else {
        // Has results but NO date → use 1st of the month column, status finished
        const [colMonth, colYear] = m.month.split('/');
        const monthNum = parseInt(colMonth);
        const year = parseInt(colYear);
        scheduledAt = new Date(year, monthNum - 1, 1, 12, 0, 0);
        status = 'finished';
      }
    } else {
      // No results
      if (scheduledAt && scheduledAt > now) {
        status = 'scheduled';
      } else if (scheduledAt && scheduledAt <= now) {
        status = 'scheduled';
      }
      // Otherwise stays pending_scheduling
    }

    // Calculate scores
    let homeScore = 0;
    let awayScore = 0;
    let winnerId: string | null = null;

    if (m.isWO) {
      // W.O.: first player wins
      if (m.sets1[0] === 'W.O.' && m.sets2[0] === 'W.O.') {
        // Both have W.O. - first player wins (based on pattern analysis)
        homeScore = 2;
        awayScore = 0;
        winnerId = homeId;
      } else if (m.sets1[0] === 'W.O.') {
        homeScore = 2;
        awayScore = 0;
        winnerId = homeId;
      } else {
        homeScore = 0;
        awayScore = 2;
        winnerId = awayId;
      }
    } else if (hasResults && m.sets1.length >= 2 && m.sets2.length >= 2) {
      const s1 = m.sets1.filter(s => typeof s === 'number') as number[];
      const s2 = m.sets2.filter(s => typeof s === 'number') as number[];

      let homeSets = 0;
      let awaySets = 0;
      for (let i = 0; i < Math.min(s1.length, s2.length); i++) {
        if (s1[i] > s2[i]) homeSets++;
        else if (s2[i] > s1[i]) awaySets++;
      }
      homeScore = homeSets;
      awayScore = awaySets;
      winnerId = homeSets > awaySets ? homeId : awaySets > homeSets ? awayId : null;
    }

    // Create sets data
    const setsData: any[] = [];
    if (!m.isWO && hasResults) {
      const s1 = m.sets1.filter(s => typeof s === 'number') as number[];
      const s2 = m.sets2.filter(s => typeof s === 'number') as number[];
      const maxSets = Math.max(s1.length, s2.length);

      for (let i = 0; i < maxSets; i++) {
        const homeGames = s1[i] || 0;
        const awayGames = s2[i] || 0;
        const isTiebreak = homeGames === 6 && awayGames === 6;
        setsData.push({
          setNumber: i + 1,
          homeGames,
          awayGames,
          isTiebreak,
          isSuperTiebreak: false,
        });
      }
    }

    // Determine endReason
    const endReason = m.isWO ? 'wo' : 'normal';

    try {
      await prisma.match.create({
        data: {
          tournamentId: tournament.id,
          homePlayerId: homeId,
          awayPlayerId: awayId,
          courtId: court.id,
          scheduledAt,
          duration: 120,
          status,
          phase: 'ranking',
          homeScore: hasResults || m.isWO ? homeScore : null,
          awayScore: hasResults || m.isWO ? awayScore : null,
          winnerId: winnerId,
          endReason,
          startedAt: status === 'finished' ? scheduledAt : null,
          finishedAt: status === 'finished' ? scheduledAt : null,
          round: m.round,
          month: m.month,
          isChallenge: m.isChallenge,
          woGivenById: m.isWO ? awayId : null,
          woReceivedById: m.isWO ? homeId : null,
          woReason: m.isWO ? 'Walkover' : null,
          sets: { create: setsData },
        },
      });
      created++;
    } catch (e: any) {
      if (e.code === 'P2002') {
        skipped++;
      } else {
        console.log(`  ❌ Erro ao criar jogo ${m.player1} vs ${m.player2}: ${e.message}`);
        skipped++;
      }
    }
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   Jogos criados: ${created}`);
  console.log(`   Jogos pulados: ${skipped}`);
  console.log(`   Total: ${created + skipped}`);
  console.log(`\n✨ Importação concluída!`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
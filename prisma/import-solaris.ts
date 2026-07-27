import 'dotenv/config';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// Lista de participantes do torneio
const participants = [
  'ALINE', 'ALÊ', 'BONA', 'CARLOS', 'CHINA', 'CHRISTIAN', 'CID', 'DU',
  'EDSON', 'EVERTON', 'EZEQUIAS', 'GIULIA', 'GUILHERME', 'GUSTAVO',
  'JANICE', 'JOAO GABRIEL', 'LUIZ', 'LUKINHA', 'MURILO', 'NICELIO',
  'SAMUEL', 'STEFAN', 'THIAGO', 'ULYSSES'
];

// Mapeamento de nomes para emails
const emailMap: Record<string, string> = {
  'ALINE': 'aline@email.com',
  'ALÊ': 'ale@email.com',
  'BONA': 'bona@email.com',
  'CARLOS': 'carlos@email.com',
  'CHINA': 'china@email.com',
  'CHRISTIAN': 'christian@email.com',
  'CID': 'cid@email.com',
  'DU': 'du@email.com',
  'EDSON': 'edson@email.com',
  'EVERTON': 'everton@email.com',
  'EZEQUIAS': 'ezequias@email.com',
  'GIULIA': 'giulia@email.com',
  'GUILHERME': 'guilherme@email.com',
  'GUSTAVO': 'gustavo@email.com',
  'JANICE': 'janice@email.com',
  'JOAO GABRIEL': 'joaogabriel@email.com',
  'LUIZ': 'luiz@email.com',
  'LUKINHA': 'lukinha@email.com',
  'MURILO': 'murilo@email.com',
  'NICELIO': 'nicelio@email.com',
  'SAMUEL': 'samuel@email.com',
  'STEFAN': 'stefan@email.com',
  'THIAGO': 'thiago@email.com',
  'ULYSSES': 'ulysses@email.com'
};

// Mapeamento de nomes para nomes completos
const fullNameMap: Record<string, string> = {
  'ALINE': 'Aline',
  'ALÊ': 'Alê',
  'BONA': 'Bona',
  'CARLOS': 'Carlos',
  'CHINA': 'China',
  'CHRISTIAN': 'Christian',
  'CID': 'Cid',
  'DU': 'Du',
  'EDSON': 'Edson',
  'EVERTON': 'Everton',
  'EZEQUIAS': 'Ezequias',
  'GIULIA': 'Giulia',
  'GUILHERME': 'Guilherme',
  'GUSTAVO': 'Gustavo',
  'JANICE': 'Janice',
  'JOAO GABRIEL': 'João Gabriel',
  'LUIZ': 'Luiz',
  'LUKINHA': 'Lukinha',
  'MURILO': 'Murilo',
  'NICELIO': 'Nicélio',
  'SAMUEL': 'Samuel',
  'STEFAN': 'Stefan',
  'THIAGO': 'Thiago',
  'ULYSSES': 'Ulysses'
};

// Dados dos jogos extraídos da planilha
const matches = [
  // Rodada 01
  { round: 'Rodada 01', month: '02/2026', player1: 'GUSTAVO', player2: 'LUIZ', sets: [2, 0], games: [[6, 3], [7, 5]], date: '2026-02-02T18:00:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'STEFAN', player2: 'CID', sets: [0, 2], games: [[3, 6], [1, 6]], date: '2026-02-04T20:00:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'GUILHERME', player2: 'ALÊ', sets: [0, 2], games: [[0, 6], [1, 6]], date: '2026-02-06T16:00:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'MURILO', player2: 'JOAO GABRIEL', sets: [2, 0], games: [[6, 0], [6, 0]], date: '2026-02-06T17:30:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'BONA', player2: 'ALINE', sets: [0, 2], games: [[5, 7], [3, 6]], date: '2026-02-06T18:30:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'GIULIA', player2: 'CHINA', sets: [1, 2], games: [[7, 5], [3, 6], [2, 6]], date: '2026-03-06T20:00:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'CARLOS', player2: 'LUKINHA', sets: [2, 0], games: [[7, 6], [6, 1]], date: '2026-02-08T16:30:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'JANICE', player2: 'ULYSSES', sets: [2, 1], games: [[3, 6], [6, 4], [6, 3]], date: '2026-02-10T08:30:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'EZEQUIAS', player2: 'CHRISTIAN', sets: [0, 2], games: [[2, 6], [3, 6]], date: '2026-02-11T18:00:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'NICELIO', player2: 'EVERTON', sets: [0, 2], games: [[0, 6], [2, 6]], date: '2026-02-14T08:30:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'SAMUEL', player2: 'DU', sets: [1, 2], games: [[2, 6], [6, 3], [2, 6]], date: '2026-02-17T17:00:00' },
  { round: 'Rodada 01', month: '02/2026', player1: 'THIAGO', player2: 'EDSON', sets: [2, 1], games: [[2, 6], [6, 0], [6, 1]], date: '2026-02-28T16:00:00' },
  
  // Rodada 02
  { round: 'Rodada 02', month: '02/2026', player1: 'JOAO GABRIEL', player2: 'ULYSSES', sets: [0, 2], games: [[0, 6], [2, 6]], date: '2026-02-05T08:30:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'SAMUEL', player2: 'LUKINHA', sets: [2, 0], games: [[6, 1], [6, 1]], date: '2026-02-05T18:30:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'STEFAN', player2: 'EDSON', sets: [0, 2], games: [[2, 6], [4, 6]], date: '2026-02-07T08:00:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'JANICE', player2: 'LUIZ', sets: [2, 0], games: [[6, 1], [6, 0]], date: '2026-02-13T09:00:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'NICELIO', player2: 'CARLOS', sets: [0, 2], games: [[0, 6], [0, 6]], date: '2026-02-15T15:30:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'THIAGO', player2: 'ALÊ', sets: [2, 0], games: [[6, 2], [6, 2]], date: '2026-02-16T18:00:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'GUILHERME', player2: 'ALINE', sets: [0, 2], games: [[1, 6], [0, 6]], date: '2026-02-20T18:30:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'GUSTAVO', player2: 'CHINA', sets: [2, 0], games: [[7, 5], [6, 3]], date: '2026-03-20T19:00:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'EZEQUIAS', player2: 'EVERTON', sets: [0, 2], games: [[3, 6], [4, 6]], date: '2026-02-21T07:30:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'MURILO', player2: 'CID', sets: [2, 0], games: [[7, 5], [6, 2]], date: '2026-03-24T18:30:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'GIULIA', player2: 'CHRISTIAN', sets: [0, 2], games: [[0, 6], [2, 6]], date: '2026-02-28T07:00:00' },
  { round: 'Rodada 02', month: '02/2026', player1: 'BONA', player2: 'DU', sets: [0, 2], games: [[4, 6], [2, 6]], date: '2026-03-31T20:00:00' },
  
  // Rodada 03
  { round: 'Rodada 03', month: '02/2026', player1: 'SAMUEL', player2: 'NICELIO', sets: [2, 0], games: [[6, 1], [6, 0]], date: '2026-02-07T16:30:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'EZEQUIAS', player2: 'CARLOS', sets: [0, 2], games: [[3, 6], [3, 6]], date: '2026-02-13T07:00:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'GUILHERME', player2: 'DU', sets: [0, 2], games: [[4, 6], [2, 6]], date: '2026-02-13T18:30:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'GUSTAVO', player2: 'CHRISTIAN', sets: [0, 2], games: [[2, 6], [0, 6]], date: '2026-02-18T18:30:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'STEFAN', player2: 'ALÊ', sets: [0, 2], games: [[2, 6], [2, 6]], date: '2026-02-21T07:00:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'MURILO', player2: 'ULYSSES', sets: [2, 0], games: [[6, 3], [6, 1]], date: '2026-02-21T07:30:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'BONA', player2: 'LUKINHA', sets: [0, 2], games: [[0, 6], [0, 6]], date: '2026-02-26T19:00:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'GIULIA', player2: 'EVERTON', sets: [0, 2], games: [[5, 7], [4, 6]], date: '2026-02-28T16:00:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'JANICE', player2: 'CHINA', sets: [2, 0], games: [[6, 1], [7, 5]], date: '2026-03-31T19:30:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'JOAO GABRIEL', player2: 'LUIZ', sets: [0, 2], games: [[1, 6], [1, 6]], date: '2026-02-01T12:00:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'CID', player2: 'EDSON', sets: [0, 2], games: [[3, 6], [5, 7]], date: '2026-02-01T12:00:00' },
  { round: 'Rodada 03', month: '02/2026', player1: 'THIAGO', player2: 'ALINE', sets: [2, 1], games: [[6, 7], [6, 0], [6, 3]], date: '2026-03-24T18:00:00' },
  
  // Rodada 04
  { round: 'Rodada 04', month: '03/2026', player1: 'JANICE', player2: 'CHRISTIAN', sets: [0, 2], games: [[5, 7], [6, 7]], date: '2026-03-18T18:00:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'BONA', player2: 'NICELIO', sets: [2, 0], games: [[6, 3], [6, 0]], date: '2026-03-22T10:00:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'GIULIA', player2: 'CARLOS', sets: [0, 2], games: [[0, 6], [0, 6]], date: '2026-03-27T06:30:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'MURILO', player2: 'EDSON', sets: [0, 2], games: [[6, 7], [2, 6]], date: '2026-03-01T12:00:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'CID', player2: 'ALÊ', sets: [0, 2], games: [[2, 6], [4, 6]], date: '2026-03-01T12:00:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'STEFAN', player2: 'ALINE', sets: [2, 0], games: [[7, 6], [6, 4]], date: '2026-03-01T12:00:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'THIAGO', player2: 'DU', sets: [2, 0], games: [[6, 4], [6, 4]], date: '2026-03-01T12:00:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'GUILHERME', player2: 'LUKINHA', sets: [0, 2], games: [[4, 6], [2, 6]], date: '2026-03-01T12:00:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'ULYSSES', player2: 'LUIZ', sets: [2, 0], games: [[6, 2], [6, 2]], date: '2026-03-01T12:00:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'JOAO GABRIEL', player2: 'CHINA', sets: [0, 2], games: [[1, 6], [0, 6]], date: '2026-03-01T12:00:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'GUSTAVO', player2: 'EVERTON', sets: [2, 0], games: [[6, 4], [6, 4]], date: '2026-03-01T12:00:00' },
  { round: 'Rodada 04', month: '03/2026', player1: 'EZEQUIAS', player2: 'SAMUEL', sets: [1, 2], games: [[2, 6], [7, 6], [2, 6]], date: '2026-03-01T12:00:00' },
  
  // Rodada 05
  { round: 'Rodada 05', month: '03/2026', player1: 'MURILO', player2: 'LUIZ', sets: [2, 0], games: [[6, 0], [6, 0]], date: '2026-03-01T12:00:00' },
  { round: 'Rodada 05', month: '03/2026', player1: 'ULYSSES', player2: 'ADVERSÁRIO PENDENTE', sets: [], games: [], date: '2026-04-26T12:00:00' }
];

async function main() {
  console.log('🎾 Importando dados do torneio Solaris...\n');

  // 1. Verificar/criar participantes
  console.log('📋 Verificando participantes...');
  const passwordHash = await bcrypt.hash('123456', 12);
  const userMap: Record<string, string> = {};

  for (const name of participants) {
    const email = emailMap[name];
    const fullName = fullNameMap[name];

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name: fullName,
          passwordHash,
        },
      });
      console.log(`  ✅ Criado: ${fullName} (${email})`);
    } else {
      console.log(`  ⏭️  Existe: ${fullName} (${email})`);
    }
    userMap[name] = user.id;
  }

  // 2. Criar torneio
  console.log('\n🏆 Criando torneio Solaris...');
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Solaris',
      description: 'Torneio de tênis - Ranking 2026',
      sport: 'tennis',
      format: 'points_ranking',
      location: 'Quadra Dura',
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-12-31'),
      maxParticipants: 24,
      isPublic: true,
      status: 'in_progress',
      ownerId: userMap['CID'], // CID como proprietário
      setsPerMatch: 3,
      setsToWin: 2,
      hasTiebreak: true,
      tiebreakScore: 6,
      hasSuperTiebreak: true,
      superTiebreakScore: 10,
      defaultMatchDuration: 120,
      delayTolerance: 15,
      generalRules: 'Torneio ranking 2026 - Formato melhor de 3 sets',
      woCriteria: 'Atraso superior a 15 minutos ou ausência sem justificativa',
    },
  });
  console.log(`  ✅ Torneio criado: ${tournament.name} (${tournament.id})`);

  // 3. Criar quadra
  console.log('\n🎾 Criando quadra...');
  const court = await prisma.court.create({
    data: {
      name: 'Quadra Dura',
      number: 1,
      surfaceType: 'hard',
      isCovered: false,
      tournamentId: tournament.id,
      ownerId: userMap['CID'],
      availabilities: {
        create: [
          { dayOfWeek: 1, startTime: '07:00', endTime: '22:00' },
          { dayOfWeek: 2, startTime: '07:00', endTime: '22:00' },
          { dayOfWeek: 3, startTime: '07:00', endTime: '22:00' },
          { dayOfWeek: 4, startTime: '07:00', endTime: '22:00' },
          { dayOfWeek: 5, startTime: '07:00', endTime: '22:00' },
          { dayOfWeek: 6, startTime: '07:00', endTime: '22:00' },
          { dayOfWeek: 0, startTime: '07:00', endTime: '22:00' }
        ]
      }
    },
  });
  console.log(`  ✅ Quadra criada: ${court.name} (${court.id})`);

  // 4. Adicionar CID como administrador
  console.log('\n👤 Adicionando CID como administrador...');
  await prisma.tournamentMember.create({
    data: {
      tournamentId: tournament.id,
      userId: userMap['CID'],
      role: 'admin',
      status: 'accepted',
      joinedAt: new Date(),
    },
  });
  console.log('  ✅ CID adicionado como administrador');

  // 5. Adicionar participantes ao torneio
  console.log('\n👥 Adicionando participantes...');
  for (const name of participants) {
    const existingMember = await prisma.tournamentMember.findUnique({
      where: { tournamentId_userId: { tournamentId: tournament.id, userId: userMap[name] } },
    });

    if (!existingMember) {
      await prisma.tournamentMember.create({
        data: {
          tournamentId: tournament.id,
          userId: userMap[name],
          role: 'player',
          status: 'accepted',
          joinedAt: new Date(),
        },
      });
    }
  }
  console.log(`  ✅ ${participants.length} participantes adicionados`);

  // 6. Criar jogos e resultados
  console.log('\n🎮 Criando jogos e resultados...');
  let matchCount = 0;

  for (const match of matches) {
    // Pular jogos com adversário pendente
    if (match.player2 === 'ADVERSÁRIO PENDENTE') {
      console.log(`  ⏭️  Pulando jogo com adversário pendente: ${match.player1}`);
      continue;
    }

    const homePlayerId = userMap[match.player1];
    const awayPlayerId = userMap[match.player2];

    if (!homePlayerId || !awayPlayerId) {
      console.log(`  ❌ Jogador não encontrado: ${match.player1} ou ${match.player2}`);
      continue;
    }

    // Calcular placar
    const homeScore = match.sets[0];
    const awayScore = match.sets[1];
    const winnerId = homeScore > awayScore ? homePlayerId : awayPlayerId;

    // Determinar status baseado na data
    const matchDate = new Date(match.date);
    const now = new Date();
    let status = 'finished';
    let scheduledAt = matchDate;

    // Se a data é no futuro, manter como agendado
    if (matchDate > now) {
      status = 'scheduled';
    }

    // Criar partida
    const createdMatch = await prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId,
        awayPlayerId,
        courtId: court.id,
        scheduledAt,
        duration: 120,
        status,
        homeScore,
        awayScore,
        winnerId,
        startedAt: matchDate,
        finishedAt: status === 'finished' ? matchDate : null,
        round: match.round,
        month: match.month,
        sets: {
          create: match.games.map((game, index) => ({
            setNumber: index + 1,
            homeGames: game[0],
            awayGames: game[1],
            isTiebreak: false,
          })),
        },
      },
    });

    matchCount++;
    console.log(`  ✅ Jogo ${matchCount}: ${match.player1} vs ${match.player2} (${match.round})`);
  }

  console.log(`\n📊 Resumo:`);
  console.log(`   Torneio: ${tournament.name}`);
  console.log(`   Quadra: ${court.name}`);
  console.log(`   Participantes: ${participants.length}`);
  console.log(`   Jogos criados: ${matchCount}`);
  console.log(`\n✨ Importação concluída!`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
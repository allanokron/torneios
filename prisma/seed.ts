import { PrismaClient } from '../src/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { hash } from 'bcryptjs'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Limpando dados existentes...')
  
  await prisma.auditLog.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.contestation.deleteMany()
  await prisma.penalty.deleteMany()
  await prisma.playerRanking.deleteMany()
  await prisma.tiebreakerConfig.deleteMany()
  await prisma.scoringConfig.deleteMany()
  await prisma.message.deleteMany()
  await prisma.matchPhoto.deleteMany()
  await prisma.set.deleteMany()
  await prisma.rescheduleRequest.deleteMany()
  await prisma.scheduleProposal.deleteMany()
  await prisma.reservation.deleteMany()
  await prisma.match.deleteMany()
  await prisma.courtBlock.deleteMany()
  await prisma.courtAvailability.deleteMany()
  await prisma.court.deleteMany()
  await prisma.invite.deleteMany()
  await prisma.tournamentMember.deleteMany()
  await prisma.tournament.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.user.deleteMany()

  console.log('Criando usuários...')
  
  const passwordHash = await hash('123456', 12)
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'allan@email.com',
        name: 'Allan Silva',
        passwordHash,
        phone: '(11) 99999-9999',
        city: 'São Paulo',
        state: 'SP',
        gameLevel: 'advanced',
        dominantHand: 'right',
        profile: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'maria@email.com',
        name: 'Maria Santos',
        passwordHash,
        phone: '(11) 88888-8888',
        city: 'São Paulo',
        state: 'SP',
        gameLevel: 'intermediate',
        dominantHand: 'right',
        profile: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'joao@email.com',
        name: 'João Oliveira',
        passwordHash,
        city: 'Rio de Janeiro',
        state: 'RJ',
        gameLevel: 'advanced',
        dominantHand: 'left',
        profile: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'ana@email.com',
        name: 'Ana Costa',
        passwordHash,
        city: 'Belo Horizonte',
        state: 'MG',
        gameLevel: 'beginner',
        dominantHand: 'right',
        profile: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'pedro@email.com',
        name: 'Pedro Lima',
        passwordHash,
        city: 'Curitiba',
        state: 'PR',
        gameLevel: 'professional',
        dominantHand: 'right',
        profile: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'julia@email.com',
        name: 'Julia Ferreira',
        passwordHash,
        city: 'Porto Alegre',
        state: 'RS',
        gameLevel: 'intermediate',
        dominantHand: 'ambidextrous',
        profile: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'lucas@email.com',
        name: 'Lucas Almeida',
        passwordHash,
        city: 'Salvador',
        state: 'BA',
        gameLevel: 'advanced',
        dominantHand: 'right',
        profile: { create: {} }
      }
    }),
    prisma.user.create({
      data: {
        email: 'camila@email.com',
        name: 'Camila Souza',
        passwordHash,
        city: 'Brasília',
        state: 'DF',
        gameLevel: 'beginner',
        dominantHand: 'right',
        profile: { create: {} }
      }
    })
  ])

  console.log('Criando torneio...')
  
  const tournament = await prisma.tournament.create({
    data: {
      name: 'Liga de Tênis 2026',
      description: 'Torneio todos contra todos para jogadores de todos os níveis. Venha competir e se divertir!',
      sport: 'tennis',
      format: 'round_robin',
      location: 'Clube Tennis São Paulo',
      address: 'Rua Augusta, 1500',
      city: 'São Paulo',
      state: 'SP',
      startDate: new Date('2026-07-15'),
      endDate: new Date('2026-08-30'),
      registrationDeadline: new Date('2026-07-10'),
      maxParticipants: 10,
      isPublic: true,
      status: 'in_progress',
      ownerId: users[0].id,
      setsPerMatch: 3,
      setsToWin: 2,
      hasTiebreak: true,
      tiebreakScore: 6,
      hasSuperTiebreak: true,
      superTiebreakScore: 10,
      defaultMatchDuration: 120,
      delayTolerance: 15,
      generalRules: 'Todos os participantes devem comparecer no horário marcado. Em caso de atraso superior a 15 minutos, será aplicado W.O.',
      woCriteria: 'Atraso superior a 15 minutos ou ausência sem justificativa.',
      scoringConfig: {
        create: {
          winWithoutLosingSet: 3,
          winLosingOneSet: 2,
          lossWinningOneSet: 1,
          lossWithoutWinningSet: 0,
          winByWO: 3,
          lossByWO: 0,
          withdrawalPenalty: -1,
          delayPenalty: -1
        }
      },
      tiebreakerConfig: {
        create: {
          criteriaOrder: [
            'points',
            'wins',
            'direct_confrontation',
            'set_balance',
            'sets_won',
            'games_balance',
            'games_won',
            'fewer_wo',
            'draw'
          ]
        }
      }
    }
  })

  console.log('Adicionando participantes...')
  
  const members = await Promise.all([
    prisma.tournamentMember.create({
      data: {
        tournamentId: tournament.id,
        userId: users[0].id,
        role: 'organizer',
        status: 'accepted',
        joinedAt: new Date()
      }
    }),
    prisma.tournamentMember.create({
      data: {
        tournamentId: tournament.id,
        userId: users[1].id,
        role: 'player',
        status: 'accepted',
        joinedAt: new Date()
      }
    }),
    prisma.tournamentMember.create({
      data: {
        tournamentId: tournament.id,
        userId: users[2].id,
        role: 'player',
        status: 'accepted',
        joinedAt: new Date()
      }
    }),
    prisma.tournamentMember.create({
      data: {
        tournamentId: tournament.id,
        userId: users[3].id,
        role: 'player',
        status: 'accepted',
        joinedAt: new Date()
      }
    }),
    prisma.tournamentMember.create({
      data: {
        tournamentId: tournament.id,
        userId: users[4].id,
        role: 'player',
        status: 'accepted',
        joinedAt: new Date()
      }
    })
  ])

  console.log('Criando quadras...')
  
  const courts = await Promise.all([
    prisma.court.create({
      data: {
        name: 'Quadra 1',
        number: 1,
        surfaceType: 'hard',
        isCovered: true,
        tournamentId: tournament.id,
        ownerId: users[0].id,
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
      }
    }),
    prisma.court.create({
      data: {
        name: 'Quadra 2',
        number: 2,
        surfaceType: 'clay',
        isCovered: false,
        tournamentId: tournament.id,
        ownerId: users[0].id,
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
      }
    }),
    prisma.court.create({
      data: {
        name: 'Quadra 3',
        number: 3,
        surfaceType: 'hard',
        isCovered: true,
        tournamentId: tournament.id,
        ownerId: users[0].id,
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
      }
    })
  ])

  console.log('Criando partidas...')
  
  const matches = await Promise.all([
    // Completed matches
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: users[0].id,
        awayPlayerId: users[1].id,
        courtId: courts[0].id,
        scheduledAt: new Date('2026-07-16T18:00:00'),
        duration: 120,
        status: 'finished',
        homeScore: 2,
        awayScore: 1,
        winnerId: users[0].id,
        startedAt: new Date('2026-07-16T18:00:00'),
        finishedAt: new Date('2026-07-16T19:45:00'),
        sets: {
          create: [
            { setNumber: 1, homeGames: 6, awayGames: 4, isTiebreak: false },
            { setNumber: 2, homeGames: 4, awayGames: 6, isTiebreak: false },
            { setNumber: 3, homeGames: 7, awayGames: 5, isTiebreak: true }
          ]
        }
      }
    }),
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: users[2].id,
        awayPlayerId: users[3].id,
        courtId: courts[1].id,
        scheduledAt: new Date('2026-07-17T19:00:00'),
        duration: 120,
        status: 'finished',
        homeScore: 2,
        awayScore: 0,
        winnerId: users[2].id,
        startedAt: new Date('2026-07-17T19:00:00'),
        finishedAt: new Date('2026-07-17T20:15:00'),
        sets: {
          create: [
            { setNumber: 1, homeGames: 6, awayGames: 2, isTiebreak: false },
            { setNumber: 2, homeGames: 6, awayGames: 3, isTiebreak: false }
          ]
        }
      }
    }),
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: users[4].id,
        awayPlayerId: users[0].id,
        courtId: courts[2].id,
        scheduledAt: new Date('2026-07-18T17:00:00'),
        duration: 120,
        status: 'finished',
        homeScore: 1,
        awayScore: 2,
        winnerId: users[0].id,
        startedAt: new Date('2026-07-18T17:00:00'),
        finishedAt: new Date('2026-07-18T19:30:00'),
        sets: {
          create: [
            { setNumber: 1, homeGames: 6, awayGames: 4, isTiebreak: false },
            { setNumber: 2, homeGames: 3, awayGames: 6, isTiebreak: false },
            { setNumber: 3, homeGames: 8, awayGames: 10, isSuperTiebreak: true }
          ]
        }
      }
    }),
    // Scheduled matches
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: users[1].id,
        awayPlayerId: users[2].id,
        courtId: courts[0].id,
        scheduledAt: new Date('2026-07-20T18:00:00'),
        duration: 120,
        status: 'scheduled'
      }
    }),
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: users[3].id,
        awayPlayerId: users[4].id,
        courtId: courts[1].id,
        scheduledAt: new Date('2026-07-21T19:00:00'),
        duration: 120,
        status: 'scheduled'
      }
    }),
    // Pending scheduling
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: users[0].id,
        awayPlayerId: users[3].id,
        duration: 120,
        status: 'pending_scheduling'
      }
    }),
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: users[1].id,
        awayPlayerId: users[4].id,
        duration: 120,
        status: 'pending_scheduling'
      }
    }),
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: users[2].id,
        awayPlayerId: users[4].id,
        duration: 120,
        status: 'pending_scheduling'
      }
    }),
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: users[0].id,
        awayPlayerId: users[2].id,
        duration: 120,
        status: 'pending_scheduling'
      }
    }),
    prisma.match.create({
      data: {
        tournamentId: tournament.id,
        homePlayerId: users[1].id,
        awayPlayerId: users[3].id,
        duration: 120,
        status: 'pending_scheduling'
      }
    })
  ])

  console.log('Criando rankings...')
  
  const rankings = await Promise.all([
    prisma.playerRanking.create({
      data: {
        tournamentId: tournament.id,
        userId: users[0].id,
        position: 1,
        points: 5,
        matchesPlayed: 2,
        wins: 2,
        losses: 0,
        setsWon: 4,
        setsLost: 2,
        gamesWon: 24,
        gamesLost: 18,
        setBalance: 2,
        gamesBalance: 6,
        lastResults: ['V', 'V']
      }
    }),
    prisma.playerRanking.create({
      data: {
        tournamentId: tournament.id,
        userId: users[2].id,
        position: 2,
        points: 3,
        matchesPlayed: 1,
        wins: 1,
        losses: 0,
        setsWon: 2,
        setsLost: 0,
        gamesWon: 12,
        gamesLost: 5,
        setBalance: 2,
        gamesBalance: 7,
        lastResults: ['V']
      }
    }),
    prisma.playerRanking.create({
      data: {
        tournamentId: tournament.id,
        userId: users[1].id,
        position: 3,
        points: 1,
        matchesPlayed: 1,
        wins: 0,
        losses: 1,
        setsWon: 1,
        setsLost: 2,
        gamesWon: 15,
        gamesLost: 16,
        setBalance: -1,
        gamesBalance: -1,
        lastResults: ['D']
      }
    }),
    prisma.playerRanking.create({
      data: {
        tournamentId: tournament.id,
        userId: users[3].id,
        position: 4,
        points: 0,
        matchesPlayed: 1,
        wins: 0,
        losses: 1,
        setsWon: 0,
        setsLost: 2,
        gamesWon: 5,
        gamesLost: 12,
        setBalance: -2,
        gamesBalance: -7,
        lastResults: ['D']
      }
    }),
    prisma.playerRanking.create({
      data: {
        tournamentId: tournament.id,
        userId: users[4].id,
        position: 5,
        points: 1,
        matchesPlayed: 1,
        wins: 0,
        losses: 1,
        setsWon: 1,
        setsLost: 2,
        gamesWon: 17,
        gamesLost: 20,
        setBalance: -1,
        gamesBalance: -3,
        lastResults: ['D']
      }
    })
  ])

  console.log('Criando proposta de agendamento...')
  
  await prisma.scheduleProposal.create({
    data: {
      matchId: matches[5].id,
      senderId: users[0].id,
      receiverId: users[3].id,
      proposedDate: new Date('2026-07-22T18:00:00'),
      proposedTime: '18:00',
      courtId: courts[0].id,
      message: 'Que tal nesse horário? A quadra está livre.',
      status: 'pending'
    }
  })

  console.log('Criando comunicados...')
  
  await prisma.announcement.create({
    data: {
      tournamentId: tournament.id,
      authorId: users[0].id,
      title: 'Bem-vindos à Liga de Tênis 2026!',
      content: 'Pessoal, sejam bem-vindos! As regras estão na aba de regras. Qualquer dúvida, me procurem. Boa sorte a todos!'
    }
  })

  console.log('Dados de demonstração criados com sucesso!')
  console.log(`Usuários: ${users.length}`)
  console.log(`Torneio: ${tournament.name}`)
  console.log(`Quadras: ${courts.length}`)
  console.log(`Partidas: ${matches.length}`)
  console.log(`Rankings: ${rankings.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
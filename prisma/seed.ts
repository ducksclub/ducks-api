import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
})

const env = envSchema.parse(process.env)

const adapter = new PrismaBetterSqlite3({
  url: env.DATABASE_URL,
})

const prisma = new PrismaClient({
  adapter,
})

const hashPassword = (password: string) => {
  return bcrypt.hash(password, env.BCRYPT_ROUNDS)
}

const addDays = (days: number) => {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

async function main() {
  console.log('🌱 Seeding database...')

  /**
   * USERS
   */
  await prisma.user.upsert({
    where: {
      email: 'admin@ducks.com',
    },
    update: {
      role: 'admin',
      nickname: 'admin',
      phone: '+77777777777',
    },
    create: {
      email: 'admin@ducks.com',
      role: 'admin',
      nickname: 'admin',
      phone: '+77777777777',
      passwordHash: await hashPassword('Admin12345!'),
    },
  })

  const user = await prisma.user.upsert({
    where: {
      email: 'user@ducks.com',
    },
    update: {
      role: 'user',
      nickname: 'testuser',
      phone: '+77770000000',
    },
    create: {
      email: 'user@ducks.com',
      role: 'user',
      nickname: 'testuser',
      phone: '+77770000000',
      passwordHash: await hashPassword('User12345!'),
    },
  })

  const telegramUser = await prisma.user.upsert({
    where: {
      email: 'telegram@ducks.com',
    },
    update: {
      role: 'user',
      nickname: 'telegram_user',
      phone: '+77770000001',
      telegramId: '100001',
    },
    create: {
      email: 'telegram@ducks.com',
      role: 'user',
      nickname: 'telegram_user',
      phone: '+77770000001',
      telegramId: '100001',
      passwordHash: await hashPassword('User12345!'),
    },
  })

  const players = await Promise.all(
    Array.from({ length: 10 }).map(async (_, index) => {
      const number = index + 1

      return prisma.user.upsert({
        where: {
          email: `player${number}@ducks.com`,
        },
        update: {
          role: 'user',
          nickname: `player_${number}`,
          phone: `+777700001${String(number).padStart(2, '0')}`,
        },
        create: {
          email: `player${number}@ducks.com`,
          role: 'user',
          nickname: `player_${number}`,
          phone: `+777700001${String(number).padStart(2, '0')}`,
          passwordHash: await hashPassword('User12345!'),
        },
      })
    }),
  )

  /**
   * EVENTS
   */
  const pokerEvent = await prisma.event.upsert({
    where: {
      id: 'seed-event-poker-main',
    },
    update: {
      title: 'Poker Night',
      city: 'Astana',
      address: 'Duck’s Club Arena',
      features: 'Покерные столы, рассадка игроков, waiting list',
      gameRules: 'Играем честно, без токсичности, уважительно к игрокам',
      gameType: 'Покер',
      startsAt: addDays(1),
      endsAt: addDays(1.15),
      participantLimit: 10,
      seatsPerTable: 9,
      status: 'published',
      imageUrl: '',
      imageHash: '',
    },
    create: {
      id: 'seed-event-poker-main',
      title: 'Poker Night',
      city: 'Astana',
      address: 'Duck’s Club Arena',
      features: 'Покерные столы, рассадка игроков, waiting list',
      gameRules: 'Играем честно, без токсичности, уважительно к игрокам',
      gameType: 'Покер',
      startsAt: addDays(1),
      endsAt: addDays(1.15),
      participantLimit: 10,
      seatsPerTable: 9,
      status: 'published',
      imageUrl: '',
      imageHash: '',
    },
  })

  const billiardEvent = await prisma.event.upsert({
    where: {
      id: 'seed-event-billiard-main',
    },
    update: {
      title: 'Billiard Evening',
      city: 'Astana',
      address: 'Duck’s Club Billiard Zone',
      features: 'Бильярдные столы, турнирная сетка, friendly format',
      gameRules: 'Соблюдать очередь и правила клуба',
      gameType: 'Бильярд',
      startsAt: addDays(2),
      endsAt: addDays(2.1),
      participantLimit: 8,
      seatsPerTable: 2,
      status: 'published',
      imageUrl: '',
      imageHash: '',
    },
    create: {
      id: 'seed-event-billiard-main',
      title: 'Billiard Evening',
      city: 'Astana',
      address: 'Duck’s Club Billiard Zone',
      features: 'Бильярдные столы, турнирная сетка, friendly format',
      gameRules: 'Соблюдать очередь и правила клуба',
      gameType: 'Бильярд',
      startsAt: addDays(2),
      endsAt: addDays(2.1),
      participantLimit: 8,
      seatsPerTable: 2,
      status: 'published',
      imageUrl: '',
      imageHash: '',
    },
  })

  const dartsEvent = await prisma.event.upsert({
    where: {
      id: 'seed-event-darts-main',
    },
    update: {
      title: 'Darts Challenge',
      city: 'Astana',
      address: 'Duck’s Club Darts Area',
      features: 'Дартс-зона, casual format, быстрые раунды',
      gameRules: 'Один игрок — одна попытка за раунд',
      gameType: 'Дартс',
      startsAt: addDays(3),
      endsAt: addDays(3.08),
      participantLimit: 12,
      seatsPerTable: 4,
      status: 'published',
      imageUrl: '',
      imageHash: '',
    },
    create: {
      id: 'seed-event-darts-main',
      title: 'Darts Challenge',
      city: 'Astana',
      address: 'Duck’s Club Darts Area',
      features: 'Дартс-зона, casual format, быстрые раунды',
      gameRules: 'Один игрок — одна попытка за раунд',
      gameType: 'Дартс',
      startsAt: addDays(3),
      endsAt: addDays(3.08),
      participantLimit: 12,
      seatsPerTable: 4,
      status: 'published',
      imageUrl: '',
      imageHash: '',
    },
  })

  /**
   * EVENT REGISTRATIONS
   */
  const pokerParticipants = [user, telegramUser, ...players]

  for (let index = 0; index < pokerParticipants.length; index++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const participant = pokerParticipants[index] as any
    const position = index + 1

    const isParticipant = position <= pokerEvent.participantLimit
    const tableNumber = isParticipant ? Math.ceil(position / pokerEvent.seatsPerTable) : null
    const seatNumber = isParticipant ? ((position - 1) % pokerEvent.seatsPerTable) + 1 : null

    await prisma.eventRegistration.upsert({
      where: {
        userId_eventId: {
          userId: participant.id,
          eventId: pokerEvent.id,
        },
      },
      update: {
        status: isParticipant ? 'PARTICIPANT' : 'WAITING',
        position,
        tableNumber,
        seatNumber,
        cancelledAt: null,
      },
      create: {
        userId: participant.id,
        eventId: pokerEvent.id,
        status: isParticipant ? 'PARTICIPANT' : 'WAITING',
        position,
        tableNumber,
        seatNumber,
      },
    })
  }

  await prisma.eventRegistration.upsert({
    where: {
      userId_eventId: {
        userId: user.id,
        eventId: billiardEvent.id,
      },
    },
    update: {
      status: 'PARTICIPANT',
      position: 1,
      tableNumber: 1,
      seatNumber: 1,
      cancelledAt: null,
    },
    create: {
      userId: user.id,
      eventId: billiardEvent.id,
      status: 'PARTICIPANT',
      position: 1,
      tableNumber: 1,
      seatNumber: 1,
    },
  })

  await prisma.eventRegistration.upsert({
    where: {
      userId_eventId: {
        userId: telegramUser.id,
        eventId: dartsEvent.id,
      },
    },
    update: {
      status: 'PARTICIPANT',
      position: 1,
      tableNumber: 1,
      seatNumber: 1,
      cancelledAt: null,
    },
    create: {
      userId: telegramUser.id,
      eventId: dartsEvent.id,
      status: 'PARTICIPANT',
      position: 1,
      tableNumber: 1,
      seatNumber: 1,
    },
  })

  /**
   * RATINGS
   */
  const ratingSeeds = [
    {
      userId: user.id,
      gameType: 'Покер',
      points: 1200,
    },
    {
      userId: user.id,
      gameType: 'Бильярд',
      points: 430,
    },
    {
      userId: user.id,
      gameType: 'Дартс',
      points: 270,
    },
    {
      userId: telegramUser.id,
      gameType: 'Покер',
      points: 980,
    },
    {
      userId: telegramUser.id,
      gameType: 'Дартс',
      points: 760,
    },
    ...players.map((player, index) => ({
      userId: player.id,
      gameType: 'Покер',
      points: 900 - index * 45,
    })),
  ]

  for (const rating of ratingSeeds) {
    await prisma.rating.upsert({
      where: {
        userId_gameType: {
          userId: rating.userId,
          gameType: rating.gameType,
        },
      },
      update: {
        points: rating.points,
      },
      create: rating,
    })
  }

  /**
   * FEEDBACK
   */
  await prisma.feedback.upsert({
    where: {
      id: 'seed-feedback-user-1',
    },
    update: {
      userId: user.id,
      message: 'Очень классный клуб, всё нравится 🔥',
    },
    create: {
      id: 'seed-feedback-user-1',
      userId: user.id,
      message: 'Очень классный клуб, всё нравится 🔥',
    },
  })

  await prisma.feedback.upsert({
    where: {
      id: 'seed-feedback-telegram-1',
    },
    update: {
      userId: telegramUser.id,
      message: 'Удобная запись через Telegram Mini App.',
    },
    create: {
      id: 'seed-feedback-telegram-1',
      userId: telegramUser.id,
      message: 'Удобная запись через Telegram Mini App.',
    },
  })

  /**
   * CONTENT PAGES
   */
  await prisma.contentPage.upsert({
    where: {
      id: 'seed-content-rules',
    },
    update: {
      key: 'rules',
      title: 'Правила клуба',
      body: '1. Уважай игроков\n2. Без токсичности\n3. Играем честно\n4. Соблюдай регламент события',
    },
    create: {
      id: 'seed-content-rules',
      key: 'rules',
      title: 'Правила клуба',
      body: '1. Уважай игроков\n2. Без токсичности\n3. Играем честно\n4. Соблюдай регламент события',
    },
  })

  await prisma.contentPage.upsert({
    where: {
      id: 'seed-content-poker-levels',
    },
    update: {
      key: 'POKER_LEVELS',
      title: 'Курс обучения покеру',
      body: 'BASE — основы игры\nMIDDLE — стратегия и позиция\nADVANCED — диапазоны и математика\nPROFI — турнирное мышление',
    },
    create: {
      id: 'seed-content-poker-levels',
      key: 'POKER_LEVELS',
      title: 'Курс обучения покеру',
      body: 'BASE — основы игры\nMIDDLE — стратегия и позиция\nADVANCED — диапазоны и математика\nPROFI — турнирное мышление',
    },
  })

  console.log('✅ Seeding completed')
  console.log('')
  console.log('Admin:')
  console.log('email: admin@ducks.com')
  console.log('password: Admin12345!')
  console.log('')
  console.log('User:')
  console.log('email: user@ducks.com')
  console.log('password: User12345!')
  console.log('')
  console.log('Telegram user:')
  console.log('email: telegram@ducks.com')
  console.log('password: User12345!')
  console.log('')
  console.log(`Created/updated users: ${players.length + 3}`)
  console.log(`Created/updated events: 3`)
  console.log(`Poker participants: ${pokerParticipants.length}`)
}

main()
  .catch((error) => {
    console.error('❌ Seed error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

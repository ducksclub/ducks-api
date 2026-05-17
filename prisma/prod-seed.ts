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

async function main() {
  console.log('🌱 Seeding database...')

  /**
   * USERS
   */
  await prisma.user.upsert({
    where: {
      email: 'admin@ducks.com',
    },
    update: {},
    create: {
      email: 'admin@ducks.com',
      name: 'Club Admin',
      role: 'admin',
      username: 'admin',
      phone: '+77777777777',
      passwordHash: await hashPassword('Admin12345!'),
    },
  })

  const user = await prisma.user.upsert({
    where: {
      email: 'user@ducks.com',
    },
    update: {},
    create: {
      email: 'user@ducks.com',
      name: 'Test User',
      role: 'user',
      username: 'testuser',
      phone: '+77770000000',
      passwordHash: await hashPassword('User12345!'),
    },
  })

  const pokerUsers = await Promise.all(
    Array.from({ length: 10 }).map(async (_, index) => {
      const number = index + 1

      return prisma.user.upsert({
        where: {
          email: `poker${number}@ducks.com`,
        },
        update: {},
        create: {
          email: `poker${number}@ducks.com`,
          name: `Poker Player ${number}`,
          role: 'user',
          username: `poker_player_${number}`,
          phone: `+777700000${String(number).padStart(2, '0')}`,
          passwordHash: await hashPassword('User12345!'),
        },
      })
    }),
  )

  /**
   * EVENTS
   *
   * participantLimit = 10
   * seatsPerTable = 9
   *
   * Всего мы ниже регистрируем 11 пользователей.
   * Поэтому:
   * - первые 10 будут PARTICIPANT
   * - 11-й будет WAITING
   */
  const event = await prisma.event.create({
    data: {
      title: 'Poker Test Event',
      city: 'Astana',
      address: 'Arena Duck Club',
      features: 'Poker tables, automatic seating, waiting list',
      gameRules: 'No toxicity, fair play',
      gameType: 'poker',
      startsAt: new Date(Date.now() + 86400000), // +1 day
      endsAt: new Date(Date.now() + 90000000),

      participantLimit: 10,
      seatsPerTable: 9,

      pointsForParticipation: 10,
      status: 'published',
      imageUrl: '',
      imageHash: '',
    },
  })

  /**
   * REGISTRATION
   *
   * Участники:
   * 1. Test User
   * 2-11. Poker Player 1-10
   *
   * Логика:
   * - если position <= participantLimit -> PARTICIPANT
   * - если position > participantLimit -> WAITING
   *
   * Распределение мест:
   * - 1-9 игроки: стол 1, места 1-9
   * - 10-й игрок: стол 2, место 1
   * - 11-й игрок: WAITING, без места
   */
  const allPokerParticipants = [user, ...pokerUsers]

  for (let index = 0; index < allPokerParticipants.length; index++) {
    const participant: any = allPokerParticipants[index]
    const position = index + 1

    const isRegistered = position <= event.participantLimit

    const tableNumber = isRegistered ? Math.ceil(position / event.seatsPerTable) : null

    const seatNumber = isRegistered ? ((position - 1) % event.seatsPerTable) + 1 : null

    await prisma.eventRegistration.create({
      data: {
        userId: participant.id,
        eventId: event.id,
        status: isRegistered ? 'PARTICIPANT' : 'WAITING',
        position,
        tableNumber,
        seatNumber,
      },
    })
  }

  /**
   * RATINGS
   */
  await prisma.rating.upsert({
    where: {
      userId_gameType: {
        userId: user.id,
        gameType: 'poker',
      },
    },
    update: {},
    create: {
      userId: user.id,
      gameType: 'poker',
      points: 1200,
    },
  })

  await prisma.rating.upsert({
    where: {
      userId_gameType: {
        userId: user.id,
        gameType: 'poker',
      },
    },
    update: {},
    create: {
      userId: user.id,
      gameType: 'poker',
      points: 500,
    },
  })

  /**
   * FEEDBACK
   */
  await prisma.feedback.create({
    data: {
      userId: user.id,
      message: 'Очень классный клуб, всё нравится 🔥',
    },
  })

  /**
   * CONTENT PAGE
   */
  await prisma.contentPage.create({
    data: {
      key: 'rules',
      title: 'Правила клуба',
      body: '1. Уважай игроков\n2. Без токсичности\n3. Играем честно',
    },
  })

  console.log('✅ Seeding completed')
  console.log('')
  console.log('Admin:')
  console.log('email: admin@ducks.com')
  console.log('password: Admin12345!')
  console.log('')
  console.log('Test User:')
  console.log('email: user@ducks.com')
  console.log('password: User12345!')
  console.log('')
  console.log('Poker users:')
  console.log('email: poker1@ducks.com - poker10@ducks.com')
  console.log('password: User12345!')
  console.log('')
  console.log('Poker Event:')
  console.log(`title: ${event.title}`)
  console.log(`participantLimit: ${event.participantLimit}`)
  console.log(`seatsPerTable: ${event.seatsPerTable}`)
  console.log('')
  console.log('Expected registrations:')
  console.log('1-10 -> PARTICIPANT')
  console.log('11 -> WAITING')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

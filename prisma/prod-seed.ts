import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'
import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config()

const prisma = new PrismaClient()

const envSchema = z.object({
  BCRYPT_ROUNDS: z.coerce.number().default(12),
})

const env = envSchema.parse(process.env)

const hashPassword = (password: string) => bcrypt.hash(password, env.BCRYPT_ROUNDS)

async function main() {
  console.log('🌱 Seeding database...')

  /**
   * USERS
   */
  await prisma.user.upsert({
    where: { email: 'admin@ducks.com' },
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
    where: { email: 'user@ducks.com' },
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

  /**
   * EVENTS
   */
  const event = await prisma.event.create({
    data: {
      title: 'Title',
      city: 'Astana',
      address: 'Arena Duck Club',
      features: '5v5, casual, friendly',
      gameRules: 'No toxicity, fair play',
      gameType: 'poker',
      startsAt: new Date(Date.now() + 86400000), // +1 day
      endsAt: new Date(Date.now() + 90000000),
      participantLimit: 10,
      pointsForParticipation: 10,
      status: 'published',
      imageUrl: '',
      imageHash: '',
    },
  })

  /**
   * REGISTRATION
   */
  await prisma.eventRegistration.create({
    data: {
      userId: user.id,
      eventId: event.id,
      status: 'active',
      position: 1,
    },
  })

  /**
   * RATINGS
   */
  await prisma.rating.upsert({
    where: {
      userId_gameType: {
        userId: user.id,
        gameType: 'cs2',
      },
    },
    update: {},
    create: {
      userId: user.id,
      gameType: 'cs2',
      points: 1200,
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
  await prisma.contentPage.upsert({
    where: { key: 'rules' },
    update: {},
    create: {
      key: 'rules',
      title: 'Правила клуба',
      body: '1. Уважай игроков\n2. Без токсичности\n3. Играем честно',
    },
  })

  console.log('✅ Seeding completed')
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

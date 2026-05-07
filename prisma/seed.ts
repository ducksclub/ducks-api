import { PrismaClient } from '@prisma/client'
import { ContentPageKeys, GameTypes, Roles } from '../src/common/types/domain.js'
import { hashPassword } from '../src/common/utils/password.js'

const prisma = new PrismaClient()

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ducksgameclub.local' },
    update: {},
    create: {
      email: 'admin@ducksgameclub.local',
      name: 'Club Admin',
      role: Roles.admin,
      passwordHash: await hashPassword('Admin12345!'),
    },
  })

  const player = await prisma.user.upsert({
    where: { email: 'player@ducksgameclub.local' },
    update: {},
    create: {
      email: 'player@ducksgameclub.local',
      name: 'Demo Player',
      role: Roles.user,
      passwordHash: await hashPassword('Player12345!'),
    },
  })

  await prisma.event.createMany({
    data: [
      {
        address: 'Friday Poker Night',
        gameType: GameTypes.poker,
        startsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        location: "DUCK'S GameClub main hall",
        participantLimit: 24,
        pointsForParticipation: 10,
        imageUrl: '/uploads/seed/poker.jpg',
        imageHash: 'seed-hash-poker-001',
      },
      {
        address: 'Darts Ladder',
        gameType: GameTypes.darts,
        startsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        location: 'Darts zone',
        participantLimit: 32,
        pointsForParticipation: 8,
        imageUrl: '/uploads/seed/darts.jpg',
        imageHash: 'seed-hash-darts-002',
      },
      {
        address: 'Billiards Cup',
        gameType: GameTypes.billiards,
        startsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        location: 'Billiards room',
        participantLimit: 16,
        pointsForParticipation: 12,
        imageUrl: '/uploads/seed/billiards.jpg',
        imageHash: 'seed-hash-billiards-003',
      },
    ],
  })

  await prisma.rating.createMany({
    data: [
      { userId: player.id, gameType: GameTypes.poker, points: 120 },
      { userId: player.id, gameType: GameTypes.darts, points: 70 },
      { userId: admin.id, gameType: GameTypes.billiards, points: 95 },
    ],
  })

  await prisma.contentPage.upsert({
    where: { key: ContentPageKeys.rules },
    update: {},
    create: {
      key: ContentPageKeys.rules,
      title: 'Club Rules',
      body: 'Respect other players, confirm event participation in advance, and follow host instructions.',
    },
  })

  await prisma.contentPage.upsert({
    where: { key: ContentPageKeys.about },
    update: {},
    create: {
      key: ContentPageKeys.about,
      title: "About DUCK'S GameClub",
      body: "DUCK'S GameClub hosts poker, darts, and billiards events for club members.",
    },
  })

  await prisma.contentPage.upsert({
    where: { key: ContentPageKeys.faq },
    update: {},
    create: {
      key: ContentPageKeys.faq,
      title: 'FAQ',
      body: 'Register for events through the web app or Telegram bot.',
    },
  })
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

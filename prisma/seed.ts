import bcrypt from 'bcrypt'
import dotenv from 'dotenv'

import { z } from 'zod'
import { Roles } from '../src/common/types/domain'
import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

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

  await prisma.user.upsert({
    where: {
      email: 'admin@ducksclub.space',
    },
    update: {
      role: 'admin',
      nickname: 'admin',
    },
    create: {
      email: 'admin@ducksclub.space',
      role: Roles.admin,
      nickname: 'admin',
      passwordHash: await hashPassword('Admin12345!'),
    },
  })

  console.log('✅ Seeding completed')
  console.log('')
  console.log('Admin:')
  console.log('email: admin@ducksclub.space')
  console.log('password: Admin12345!')
  console.log('')
}

main()
  .catch((error) => {
    console.error('❌ Seed error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

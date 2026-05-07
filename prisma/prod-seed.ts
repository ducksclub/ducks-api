import { PrismaClient } from '@prisma/client'
import { Roles } from '../src/common/types/domain.js'
import { hashPassword } from '../src/common/utils/password.js'

const prisma = new PrismaClient()

async function main() {
  await prisma.user.upsert({
    where: { email: 'admin@ducks.com' },
    update: {},
    create: {
      email: 'admin@ducks.com',
      name: 'Club Admin',
      role: Roles.admin,
      passwordHash: await hashPassword('Admin12345!'),
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

import { publicUserSelect } from './auth.helpers'
import type { PublicUser, UserWithPassword } from './auth.types'
import type { Prisma, PrismaClient } from '@prisma/client'

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      select: publicUserSelect,
    })
  }

  createUser(
    tx: Prisma.TransactionClient,
    data: Omit<UserWithPassword, 'id'>,
  ): Promise<PublicUser> {
    return tx.user.create({
      data: {
        role: data.role,
        email: data.email,
        phone: data.phone ?? null,
        passwordHash: data.passwordHash,
        telegramId: data.telegramId ?? null,
        promoLinkId: data.promoLinkId ?? null,
        sourceCode: data.sourceCode ?? null,
        sourceType: data.sourceType ?? null,
      },
      select: publicUserSelect,
    })
  }
}

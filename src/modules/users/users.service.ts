import type { PrismaClient } from '@prisma/client'
import { notFound } from '../../common/errors/app-error'

export type CreateUserDto = {
  telegram_id: string
  name?: string | null
}

export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        ratings: { select: { gameType: true, points: true } },
      },
    })
    if (!user) throw notFound('User not found')
    return user
  }

  async getProfileByTelegramId(telegramId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        telegram_id: telegramId,
      },
    })

    if (!user) throw notFound('User not found')
    return user
  }

  async createUserService(data: CreateUserDto) {
    const { telegram_id, name } = data

    const user = await this.prisma.user.upsert({
      where: {
        telegram_id,
      },
      update: {
        ...(name ? { name } : {}),
      },
      create: {
        telegram_id,
        name: name ?? null,

        /**
         * system email for telegram-only users
         */
        email: `tg_${telegram_id}@duck.local`,

        passwordHash: 'telegram-auth',
      },
    })

    return user
  }
}

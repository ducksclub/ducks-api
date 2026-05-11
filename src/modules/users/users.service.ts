import type { PrismaClient } from '@prisma/client'
import { notFound } from '../../common/errors/app-error'
import { UpdateProfileDto } from './users.schemas'

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
        avatarUrl: true,
        telegram_id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        ratings: { select: { gameType: true, points: true } },
      },
    })
    if (!user) throw notFound('User not found')
    return user
  }

  async updateProfile(dto: UpdateProfileDto, userId: string) {
    const data = Object.fromEntries(
      Object.entries({
        name: dto.name,
        phone: dto.phone,
        username: dto.username,
        avatarUrl: dto.avatarUrl,
        avatarHash: dto.avatarHash,
      }).filter(([, v]) => v !== undefined),
    )

    const user = await this.prisma.user.update({
      data,
      where: { id: userId },
      select: {
        id: true,
        avatarUrl: true,
        telegram_id: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        username: true,
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
        username: telegram_id,

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

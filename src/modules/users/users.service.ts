import type { PrismaClient } from '@prisma/client'
import { notFound } from '../../common/errors/app-error'
import { UpdateProfileDto } from './users.schemas'

export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        email: true,
        phone: true,
        nickname: true,
        avatarUrl: true,
        telegramId: true,
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
        phone: dto.phone,
        nickname: dto.nickname,
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
        telegramId: true,
        email: true,
        role: true,
        phone: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,
        ratings: { select: { gameType: true, points: true } },
      },
    })
    if (!user) throw notFound('Пользователь не найден')
    return user
  }

  async getProfileByTelegramId(telegramId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        telegramId,
      },
    })

    if (!user) throw notFound('Пользователь не найден')
    return user
  }
}

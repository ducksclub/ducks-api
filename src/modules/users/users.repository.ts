import { PublicUser, UserWithPassword } from '../auth/auth.types'
import type { PrismaClient } from '@prisma/client'

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  updateUser(
    userId: string,
    data: Omit<UserWithPassword, 'id' | 'passwordHash' | 'email'>,
  ): Promise<PublicUser> {
    return this.prisma.user.update({
      data,
      where: {
        id: userId,
      },
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
  }
}

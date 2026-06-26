import { publicUserSelect } from './auth.helpers'
import type { PublicUser, UserWithPassword } from './auth.types'
import type { PrismaClient } from '@prisma/client'

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      omit: {
        passwordHash: true,
        sourceCode: true,
        sourceType: true,
        promoLinkId: true,
      },
    })
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    })
  }

  findByNickname(nickname: string) {
    return this.prisma.user.findUnique({
      where: { nickname },
      omit: {
        passwordHash: true,
        sourceCode: true,
        sourceType: true,
        promoLinkId: true,
      },
    })
  }

  findByTelegramId(telegramId: string) {
    return this.prisma.user.findUnique({
      where: { telegramId },
      omit: {
        passwordHash: true,
        sourceCode: true,
        sourceType: true,
        promoLinkId: true,
      },
    })
  }

  attachTelegramIdToUser(userId: string, telegramId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { telegramId },
    })
  }

  updateTelegramLocalUserCredentials(userId: string, email: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        email,
        passwordHash,
      },
      select: publicUserSelect,
    })
  }

  createUser(data: Omit<UserWithPassword, 'id'>): Promise<PublicUser> {
    return this.prisma.user.create({
      data: {
        role: data.role,
        email: data.email,
        phone: data.phone ?? null,
        nickname: data.nickname,
        avatarUrl: data.avatarUrl ?? null,
        telegramId: data.telegramId ?? null,
        passwordHash: data.passwordHash,
      },
      select: publicUserSelect,
    })
  }
}

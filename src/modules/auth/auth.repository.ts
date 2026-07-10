import { publicUserSelect } from './auth.helpers'
import type { PublicUser, UserWithPassword } from './auth.types'
import type { PrismaClient } from '@prisma/client'

export class AuthRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findAll() {
    return this.prisma.user.findMany({
      omit: {
        passwordHash: true,
        sourceCode: true,
        sourceType: true,
        promoLinkId: true,
      },
    })
  }

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
      select: publicUserSelect,
    })
  }

  updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
      select: publicUserSelect,
    })
  }

  createPasswordResetToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return this.prisma.passwordResetToken.create({
      data,
    })
  }

  findPasswordResetToken(tokenHash: string) {
    return this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    })
  }

  attachTelegramIdToUser(userId: string, telegramId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { telegramId },
    })
  }

  updateTelegramProfile(userId: string, data: { avatarUrl?: string | null }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: publicUserSelect,
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

import { notFound } from '../../common/errors/app-error'
import { AuthRepository } from '../auth/auth.repository'
import { UsersRepository } from './users.repository'
import type { PrismaClient } from '@prisma/client'
import type { UpdateProfileDto } from './users.schemas'
import { UserWithPassword } from '../auth/auth.types'

export class UsersService {
  private readonly authRepository: AuthRepository
  private readonly repository: UsersRepository

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new UsersRepository(prisma)
    this.authRepository = new AuthRepository(prisma)
  }

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
    ) as Omit<UserWithPassword, 'id' | 'passwordHash' | 'email'>

    const user = await this.repository.updateUser(userId, data)

    if (!user) throw notFound('Пользователь не найден')
    return user
  }

  async getProfileByTelegramId(telegramId: string) {
    const user = await this.authRepository.findByTelegramId(telegramId)
    if (!user) throw notFound('Пользователь не найден')
    return user
  }

  async getProfileByNickname(nickname: string) {
    const user = await this.authRepository.findByNickname(nickname)
    if (!user) throw notFound('Пользователь не найден')
    return user
  }
}

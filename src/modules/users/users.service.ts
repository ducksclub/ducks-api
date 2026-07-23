import { notFound } from '../../common/errors/app-error'
import { AuthRepository } from '../auth/auth.repository'
import { UsersRepository } from './users.repository'
import type { PrismaClient } from '@prisma/client'
import type { UpdateProfileDto, UpdateUserGameStatsDto } from './users.schemas'
import { UserWithPassword } from '../auth/auth.types'
import { GameTypes, type GameType } from '../../common/types/domain'

export class UsersService {
  private readonly authRepository: AuthRepository
  private readonly repository: UsersRepository

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new UsersRepository(prisma)
    this.authRepository = new AuthRepository(prisma)
  }

  async getProfile(userId: string) {
    const user = await this.authRepository.findById(userId)
    if (!user) throw notFound('Пользователь не найден')
    return user
  }

  async getProfiles() {
    const profiles = await this.repository.findAllWithGameStats()

    return profiles.map(({ ratings, registrations, ...profile }) => {
      const bountyByGame = new Map<string, number>()
      const ratingByGame = new Map(ratings.map((rating) => [rating.gameType, rating]))

      for (const registration of registrations) {
        const gameType = registration.event.gameType
        bountyByGame.set(gameType, (bountyByGame.get(gameType) ?? 0) + registration.bounty)
      }

      return {
        ...profile,
        ratings: Object.values(GameTypes).map((gameType) => {
          const rating = ratingByGame.get(gameType)

          return {
            gameType,
            points: rating?.points ?? 0,
            bounty: (bountyByGame.get(gameType) ?? 0) + (rating?.bountyAdjustment ?? 0),
          }
        }),
      }
    })
  }

  async getPublicProfile(userId: string) {
    const user = await this.repository.findProfileById(userId)
    if (!user) throw notFound('Пользователь не найден')
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

  async updateGameStats(userId: string, gameType: GameType, dto: UpdateUserGameStatsDto) {
    return this.repository.transaction(async (tx) => {
      const user = await this.repository.findUserById(tx, userId)
      if (!user) throw notFound('Пользователь не найден')

      const [current, completedBounty] = await Promise.all([
        this.repository.findRating(tx, userId, gameType),
        this.repository.getCompletedBounty(tx, userId, gameType),
      ])
      const eventBounty = completedBounty._sum.bounty ?? 0
      const points = dto.points ?? current?.points ?? 0
      const bountyAdjustment =
        dto.bounty !== undefined
          ? dto.bounty - eventBounty
          : (current?.bountyAdjustment ?? 0)

      const rating = await this.repository.upsertGameStats(tx, {
        userId,
        gameType,
        points,
        bountyAdjustment,
      })

      return {
        userId: rating.userId,
        gameType: rating.gameType,
        points: rating.points,
        bounty: eventBounty + rating.bountyAdjustment,
      }
    })
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

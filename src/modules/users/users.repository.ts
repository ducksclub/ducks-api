import { PublicUser, UserWithPassword } from '../auth/auth.types'
import { EventStatuses, type GameType } from '../../common/types/domain'
import type { Prisma, PrismaClient } from '@prisma/client'

export class UsersRepository {
  constructor(private readonly prisma: PrismaClient) {}

  findProfileById(userId: string) {
    return this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        avatarUrl: true,
        role: true,
        nickname: true,
        createdAt: true,
        updatedAt: true,
        ratings: { select: { gameType: true, points: true } },
      },
    })
  }

  findAllWithGameStats() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        telegramId: true,
        email: true,
        nickname: true,
        role: true,
        phone: true,
        avatarUrl: true,
        avatarHash: true,
        createdAt: true,
        updatedAt: true,
        ratings: {
          select: {
            gameType: true,
            points: true,
            bountyAdjustment: true,
          },
        },
        registrations: {
          where: {
            event: {
              status: EventStatuses.completed,
            },
          },
          select: {
            bounty: true,
            event: {
              select: {
                gameType: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
  }

  transaction<T>(callback: (tx: Prisma.TransactionClient) => Promise<T>) {
    return this.prisma.$transaction(callback)
  }

  findUserById(tx: Prisma.TransactionClient, userId: string) {
    return tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
  }

  getCompletedBounty(tx: Prisma.TransactionClient, userId: string, gameType: GameType) {
    return tx.eventRegistration.aggregate({
      where: {
        userId,
        event: {
          gameType,
          status: EventStatuses.completed,
        },
      },
      _sum: {
        bounty: true,
      },
    })
  }

  findRating(tx: Prisma.TransactionClient, userId: string, gameType: GameType) {
    return tx.rating.findUnique({
      where: {
        userId_gameType: { userId, gameType },
      },
    })
  }

  upsertGameStats(
    tx: Prisma.TransactionClient,
    params: {
      userId: string
      gameType: GameType
      points: number
      bountyAdjustment: number
    },
  ) {
    return tx.rating.upsert({
      where: {
        userId_gameType: {
          userId: params.userId,
          gameType: params.gameType,
        },
      },
      create: params,
      update: {
        points: params.points,
        bountyAdjustment: params.bountyAdjustment,
      },
      select: {
        userId: true,
        gameType: true,
        points: true,
        bountyAdjustment: true,
      },
    })
  }

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

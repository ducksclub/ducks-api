import type { PrismaClient } from '@prisma/client'
import { badRequest, notFound } from '../../common/errors/app-error.js'
import type { GameType } from '../../common/types/domain.js'
import { getPagination, paginated } from '../../common/utils/pagination.js'
import type { AwardPointsDto, RatingListQuery } from './ratings.schemas.js'

export class RatingsService {
  constructor(private readonly prisma: PrismaClient) {}

  async top(gameType: GameType, query: RatingListQuery) {
    const [ratings, total] = await this.prisma.$transaction([
      this.prisma.rating.findMany({
        where: { gameType },
        ...getPagination(query),
        orderBy: [{ points: 'desc' }, { updatedAt: 'asc' }],
        include: {
          user: { select: { id: true, email: true, name: true, username: true, avatarUrl: true } },
        },
      }),
      this.prisma.rating.count({ where: { gameType } }),
    ])
    return paginated(ratings, total, query)
  }

  async award(dto: AwardPointsDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } })
    if (!user) throw notFound('User not found')

    const current = await this.prisma.rating.findUnique({
      where: { userId_gameType: { userId: dto.userId, gameType: dto.gameType } },
    })
    if (current && current.points + dto.points < 0)
      throw badRequest('Rating points cannot become negative')

    return this.prisma.rating.upsert({
      where: { userId_gameType: { userId: dto.userId, gameType: dto.gameType } },
      create: { userId: dto.userId, gameType: dto.gameType, points: Math.max(dto.points, 0) },
      update: { points: { increment: dto.points } },
    })
  }
}

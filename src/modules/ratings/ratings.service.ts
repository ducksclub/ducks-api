import { badRequest, notFound } from "../../common/errors/app-error";
import type { PrismaClient } from "@prisma/client";
import type { GameType } from "../../common/types/domain";
import type { AwardPointsDto } from "./ratings.schemas";

export class RatingsService {
  constructor(private readonly prisma: PrismaClient) {}

  async top(gameType: GameType) {
    const ratings = await this.prisma.rating.findMany({
      where: { gameType },
      orderBy: [{ points: "desc" }, { updatedAt: "asc" }],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            nickname: true,
            avatarUrl: true,
          },
        },
      },
    });

    const bountyTotals = ratings.length
      ? await this.prisma.eventRegistration.groupBy({
          by: ["userId"],
          where: {
            userId: { in: ratings.map(({ userId }) => userId) },
            event: {
              gameType,
              status: "completed",
            },
          },
          _sum: {
            bounty: true,
          },
        })
      : [];

    const bountyByUserId = new Map(
      bountyTotals.map(({ userId, _sum }) => [userId, _sum.bounty ?? 0]),
    );

    return ratings.map(({ bountyAdjustment, ...rating }) => ({
      ...rating,
      bounty: (bountyByUserId.get(rating.userId) ?? 0) + bountyAdjustment,
    }));
  }

  async award(dto: AwardPointsDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw notFound("User not found");

    const current = await this.prisma.rating.findUnique({
      where: {
        userId_gameType: { userId: dto.userId, gameType: dto.gameType },
      },
    });
    if (current && current.points + dto.points < 0)
      throw badRequest("Rating points cannot become negative");

    return this.prisma.rating.upsert({
      where: {
        userId_gameType: { userId: dto.userId, gameType: dto.gameType },
      },
      create: {
        userId: dto.userId,
        gameType: dto.gameType,
        points: Math.max(dto.points, 0),
      },
      update: { points: { increment: dto.points } },
    });
  }
}

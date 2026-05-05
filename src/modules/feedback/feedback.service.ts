import type { PrismaClient } from "@prisma/client";
import { getPagination, paginated } from "../../common/utils/pagination.js";
import type { FeedbackCreateDto, FeedbackListQuery } from "./feedback.schemas.js";

export class FeedbackService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(dto: FeedbackCreateDto, userId?: string) {
    return this.prisma.feedback.create({
      data: {
        message: dto.message,
        name: dto.name ?? null,
        email: dto.email ?? null,
        ...(userId ? { user: { connect: { id: userId } } } : {})
      }
    });
  }

  async list(query: FeedbackListQuery) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.feedback.findMany({
        ...getPagination(query),
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, email: true, name: true } } }
      }),
      this.prisma.feedback.count()
    ]);
    return paginated(items, total, query);
  }
}

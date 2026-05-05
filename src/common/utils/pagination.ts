import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export type Pagination = z.infer<typeof paginationSchema>;

export const getPagination = ({ page, limit }: Pagination) => ({
  skip: (page - 1) * limit,
  take: limit
});

export const paginated = <T>(data: T[], total: number, pagination: Pagination) => ({
  data,
  meta: {
    total,
    page: pagination.page,
    limit: pagination.limit,
    pages: Math.ceil(total / pagination.limit)
  }
});

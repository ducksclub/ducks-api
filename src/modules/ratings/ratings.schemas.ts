import { z } from "zod";
import { enumValues, GameTypes } from "../../common/types/domain.js";
import { paginationSchema } from "../../common/utils/pagination.js";

export const ratingGameParamsSchema = z.object({ game: z.enum(enumValues(GameTypes)) });
export const ratingListQuerySchema = paginationSchema;

export const awardPointsSchema = z.object({
  userId: z.string().min(1),
  gameType: z.enum(enumValues(GameTypes)),
  points: z.number().int().min(-100000).max(100000)
});

export type AwardPointsDto = z.infer<typeof awardPointsSchema>;
export type RatingListQuery = z.infer<typeof ratingListQuerySchema>;

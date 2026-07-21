import { z } from "zod";
import { enumValues, GameTypes } from "../../common/types/domain.js";

export const ratingGameParamsSchema = z.object({ game: z.enum(enumValues(GameTypes)) });

export const awardPointsSchema = z.object({
  userId: z.string().min(1),
  gameType: z.enum(enumValues(GameTypes)),
  points: z.number().int().min(-100000).max(100000)
});

export type AwardPointsDto = z.infer<typeof awardPointsSchema>;

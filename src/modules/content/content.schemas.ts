import { z } from "zod";
import { ContentPageKeys, enumValues } from "../../common/types/domain.js";

export const contentKeyParamsSchema = z.object({ key: z.enum(enumValues(ContentPageKeys)) });

export const upsertContentSchema = z.object({
  title: z.string().min(2).max(160),
  body: z.string().min(1).max(50000)
});

export type UpsertContentDto = z.infer<typeof upsertContentSchema>;

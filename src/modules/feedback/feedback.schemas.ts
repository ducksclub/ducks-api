import { z } from "zod";
import { paginationSchema } from "../../common/utils/pagination.js";

export const feedbackCreateSchema = z.object({
  message: z.string().min(5).max(5000)
});

export const feedbackListQuerySchema = paginationSchema;

export type FeedbackCreateDto = z.infer<typeof feedbackCreateSchema>;
export type FeedbackListQuery = z.infer<typeof feedbackListQuerySchema>;

import { z } from "zod";
import { paginationSchema } from "../../common/utils/pagination.js";

export const feedbackCreateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  message: z.string().min(5).max(5000)
});

export const feedbackListQuerySchema = paginationSchema;

export type FeedbackCreateDto = z.infer<typeof feedbackCreateSchema>;
export type FeedbackListQuery = z.infer<typeof feedbackListQuerySchema>;

import { z } from "zod";

export const botRegisterSchema = z.object({
  eventId: z.string().min(1),
  userId: z.string().min(1)
});

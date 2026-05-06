import { z } from 'zod'

export const uploadImageSchema = z.object({
  file: z.any(),
})

export type UploadImageInput = z.infer<typeof uploadImageSchema>

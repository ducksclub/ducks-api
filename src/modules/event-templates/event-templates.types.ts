import type { z } from 'zod'
import type { PrismaClient } from '@prisma/client'
import type { eventTemplateListQuerySchema } from './event-templates.schemas'

export type EventTemplateListQuery = z.infer<typeof eventTemplateListQuerySchema>
export type EventTemplatePrismaClient = PrismaClient

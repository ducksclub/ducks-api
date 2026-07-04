import type { z } from 'zod'
import type { eventTemplateListQuerySchema } from './event-templates.schemas'

export type EventTemplateListQuery = z.infer<typeof eventTemplateListQuerySchema>

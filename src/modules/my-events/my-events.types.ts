import z from 'zod'
import { myEventsQuerySchema } from './my-events.schemas'

export type MyEventsQuery = z.infer<typeof myEventsQuerySchema>

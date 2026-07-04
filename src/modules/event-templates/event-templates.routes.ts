import { Router } from 'express'
import { validate } from '../../common/middleware/validate'
import { asyncHandler } from '../../common/utils/async-handler'
import { listEventTemplates } from './event-templates.controller'
import { eventTemplateListQuerySchema } from './event-templates.schemas'

export const eventTemplatesRouter = Router()

eventTemplatesRouter.get(
  '/',
  validate({ query: eventTemplateListQuerySchema }),
  asyncHandler(listEventTemplates),
)

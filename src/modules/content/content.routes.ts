import { Router } from 'express'
import { authenticate, authorize } from '../../common/middleware/auth.js'
import { validate } from '../../common/middleware/validate.js'
import { Roles } from '../../common/types/domain.js'
import { asyncHandler } from '../../common/utils/async-handler.js'
import {
  getContentById,
  getContentByKey,
  getContents,
  upsertContentPage,
} from './content.controller.js'
import {
  contentKeyByKeyParamsSchema,
  contentKeyParamsSchema,
  upsertContentSchema,
} from './content.schemas.js'

export const contentRouter = Router()

contentRouter.get('/', asyncHandler(getContents))
contentRouter.get(
  '/by-key/:key',
  authenticate,
  validate({ params: contentKeyByKeyParamsSchema }),
  asyncHandler(getContentByKey),
)
contentRouter.get('/:id', asyncHandler(getContentById))
contentRouter.put(
  '/:id',
  authenticate,
  authorize(Roles.admin),
  validate({ params: contentKeyParamsSchema, body: upsertContentSchema }),
  asyncHandler(upsertContentPage),
)

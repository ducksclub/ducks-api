import { Router } from 'express'
import { authenticate, authorize } from '../../common/middleware/auth.js'
import { botAuth } from '../../common/middleware/bot-auth.js'
import { validate } from '../../common/middleware/validate.js'
import { Roles } from '../../common/types/domain.js'
import { asyncHandler } from '../../common/utils/async-handler.js'
import {
  createPromoLink,
  getPromoLink,
  listPromoLinks,
  telegramStart,
  trackPromoClick,
  updatePromoLink,
} from './promo-link.controller.js'
import {
  createPromoLinkSchema,
  promoLinkIdParamsSchema,
  telegramStartSchema,
  trackPromoClickSchema,
  updatePromoLinkSchema,
} from './promo-link.dto.js'

export const adminPromoLinksRouter = Router()
export const publicPromoLinksRouter = Router()

adminPromoLinksRouter.use(authenticate, authorize(Roles.admin))

adminPromoLinksRouter.post('/', validate({ body: createPromoLinkSchema }), asyncHandler(createPromoLink))
adminPromoLinksRouter.get('/', asyncHandler(listPromoLinks))
adminPromoLinksRouter.get(
  '/:id',
  validate({ params: promoLinkIdParamsSchema }),
  asyncHandler(getPromoLink),
)
adminPromoLinksRouter.patch(
  '/:id',
  validate({ params: promoLinkIdParamsSchema, body: updatePromoLinkSchema }),
  asyncHandler(updatePromoLink),
)

publicPromoLinksRouter.post(
  '/track-click',
  validate({ body: trackPromoClickSchema }),
  asyncHandler(trackPromoClick),
)
publicPromoLinksRouter.post(
  '/telegram-start',
  botAuth,
  validate({ body: telegramStartSchema }),
  asyncHandler(telegramStart),
)

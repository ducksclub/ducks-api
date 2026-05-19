import { PromoLinkType, type Prisma, type PrismaClient } from '@prisma/client'
import { badRequest, conflict, notFound } from '../../common/errors/app-error.js'
import { env } from '../../config/env.js'
import type {
  CreatePromoLinkDto,
  TelegramStartDto,
  TrackPromoClickDto,
  UpdatePromoLinkDto,
} from './promo-link.dto.js'
import { generatePromoUrl, normalizePromoCode } from './promo-link.utils.js'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

type ActivePromoLink = {
  id: string
  code: string
  type: PromoLinkType
  isActive: boolean
}

type ClickMeta = {
  ip?: string | undefined
  userAgent?: string | undefined
}

const telegramPromoTypes = new Set<PromoLinkType>([
  PromoLinkType.TELEGRAM_BOT,
  PromoLinkType.TELEGRAM_MINI_APP,
])

const promoLinkSelect = {
  id: true,
  name: true,
  code: true,
  type: true,
  targetUrl: true,
  generatedUrl: true,
  clicksCount: true,
  registrationsCount: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const

const toPromoLinkResponse = <
  T extends {
    code: string
    type: PromoLinkType
    targetUrl: string | null
    generatedUrl: string | null
    clicksCount: number
    registrationsCount: number
  },
>(
  promoLink: T,
) => ({
  ...promoLink,
  url:
    promoLink.generatedUrl ??
    generatePromoUrl({
      type: promoLink.type,
      code: promoLink.code,
      targetUrl: promoLink.targetUrl,
    }),
  conversionRate:
    promoLink.clicksCount === 0
      ? 0
      : Number(((promoLink.registrationsCount / promoLink.clicksCount) * 100).toFixed(2)),
})

export class PromoLinkService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(dto: CreatePromoLinkDto) {
    this.assertUrlConfig(dto.type)

    const code = dto.code ? normalizePromoCode(dto.code) : await this.generateUniqueCode(dto.name)
    const existing = await this.prisma.promoLink.findUnique({ where: { code } })
    if (existing) throw conflict('Promo code already exists')

    const generatedUrl = generatePromoUrl({
      type: dto.type,
      code,
      targetUrl: dto.targetUrl ?? null,
    })

    const promoLink = await this.prisma.promoLink.create({
      data: {
        name: dto.name,
        type: dto.type,
        code,
        targetUrl: dto.targetUrl ?? null,
        generatedUrl,
      },
      select: promoLinkSelect,
    })

    return toPromoLinkResponse(promoLink)
  }

  async list() {
    const promoLinks = await this.prisma.promoLink.findMany({
      orderBy: { createdAt: 'desc' },
      select: promoLinkSelect,
    })

    return promoLinks.map(toPromoLinkResponse)
  }

  async get(id: string) {
    const promoLink = await this.prisma.promoLink.findUnique({
      where: { id },
      select: promoLinkSelect,
    })
    if (!promoLink) throw notFound('Promo link not found')

    return toPromoLinkResponse(promoLink)
  }

  async update(id: string, dto: UpdatePromoLinkDto) {
    const current = await this.prisma.promoLink.findUnique({
      where: { id },
      select: promoLinkSelect,
    })
    if (!current) throw notFound('Promo link not found')

    const nextType = dto.type ?? current.type
    const nextTargetUrl = dto.targetUrl === undefined ? current.targetUrl : dto.targetUrl
    this.assertUrlConfig(nextType)

    const generatedUrl = generatePromoUrl({
      type: nextType,
      code: current.code,
      targetUrl: nextTargetUrl,
    })

    const data: Prisma.PromoLinkUpdateInput = {}
    if (dto.name !== undefined) data.name = dto.name
    if (dto.type !== undefined) data.type = dto.type
    if (dto.targetUrl !== undefined) data.targetUrl = dto.targetUrl
    if (dto.isActive !== undefined) data.isActive = dto.isActive
    data.generatedUrl = generatedUrl

    const promoLink = await this.prisma.promoLink.update({
      where: { id },
      data,
      select: promoLinkSelect,
    })

    return toPromoLinkResponse(promoLink)
  }

  async trackClick(dto: TrackPromoClickDto, meta: ClickMeta = {}) {
    const promoLink = await this.prisma.promoLink.findUnique({
      where: { code: dto.code },
      select: { id: true, code: true, type: true, isActive: true },
    })

    if (!promoLink?.isActive || (dto.type && promoLink.type !== dto.type)) {
      return {
        success: false,
        message: 'Promo link not found or inactive',
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.promoLink.update({
        where: { id: promoLink.id },
        data: { clicksCount: { increment: 1 } },
      })
      await this.createClick(tx, promoLink, dto.telegramUserId, meta)
    })

    return {
      success: true,
      code: promoLink.code,
      type: promoLink.type,
    }
  }

  async telegramStart(dto: TelegramStartDto, meta: ClickMeta = {}) {
    return this.prisma.$transaction(async (tx) => {
      const promoLink = await tx.promoLink.findUnique({
        where: { code: dto.promoCode },
        select: { id: true, code: true, type: true, isActive: true },
      })

      if (!promoLink?.isActive || !telegramPromoTypes.has(promoLink.type)) {
        return {
          success: false,
          message: 'Promo link not found or inactive',
        }
      }

      await tx.promoLink.update({
        where: { id: promoLink.id },
        data: { clicksCount: { increment: 1 } },
      })
      await this.createClick(tx, promoLink, dto.telegramUserId, meta)

      const user = await tx.user.findUnique({
        where: { telegramId: dto.telegramUserId },
        select: { id: true, promoLinkId: true, sourceCode: true, sourceType: true },
      })

      let userLinked = false

      if (user && !user.promoLinkId && !user.sourceCode && !user.sourceType) {
        const result = await this.attachPromoToExistingUser(tx, user.id, promoLink)
        userLinked = result.userLinked
      }

      if (!user) {
        await tx.promoStartSession.upsert({
          where: { telegramUserId: dto.telegramUserId },
          update: {
            promoCode: promoLink.code,
            promoLinkId: promoLink.id,
            type: promoLink.type,
          },
          create: {
            telegramUserId: dto.telegramUserId,
            promoCode: promoLink.code,
            promoLinkId: promoLink.id,
            type: promoLink.type,
          },
        })
      }

      return {
        success: true,
        code: promoLink.code,
        type: promoLink.type,
        userLinked,
      }
    })
  }

  async findActivePromoForRegistration(
    executor: PrismaExecutor,
    promoCode?: string | null,
    telegramUserId?: string | null,
  ): Promise<ActivePromoLink | null> {
    const normalizedCode = promoCode ? normalizePromoCode(promoCode) : undefined

    if (normalizedCode) {
      const promoLink = await executor.promoLink.findUnique({
        where: { code: normalizedCode },
        select: { id: true, code: true, type: true, isActive: true },
      })

      if (promoLink?.isActive) return promoLink
    }

    if (!telegramUserId) return null

    const session = await executor.promoStartSession.findUnique({
      where: { telegramUserId },
      select: {
        promoCode: true,
        promoLink: {
          select: { id: true, code: true, type: true, isActive: true },
        },
      },
    })

    if (session?.promoLink?.isActive) return session.promoLink

    if (session?.promoCode) {
      const promoLink = await executor.promoLink.findUnique({
        where: { code: session.promoCode },
        select: { id: true, code: true, type: true, isActive: true },
      })

      if (promoLink?.isActive) return promoLink
    }

    return null
  }

  async incrementRegistration(executor: PrismaExecutor, promoLinkId: string) {
    await executor.promoLink.update({
      where: { id: promoLinkId },
      data: { registrationsCount: { increment: 1 } },
    })
  }

  async attachPromoToExistingUser(
    executor: PrismaExecutor,
    userId: string,
    promoLink: ActivePromoLink,
  ) {
    const result = await executor.user.updateMany({
      where: {
        id: userId,
        promoLinkId: null,
        sourceCode: null,
        sourceType: null,
      },
      data: {
        promoLinkId: promoLink.id,
        sourceCode: promoLink.code,
        sourceType: promoLink.type,
      },
    })

    if (result.count > 0) {
      await this.incrementRegistration(executor, promoLink.id)
    }

    return {
      userLinked: result.count > 0,
    }
  }

  private async createClick(
    executor: PrismaExecutor,
    promoLink: ActivePromoLink,
    telegramUserId?: string,
    meta: ClickMeta = {},
  ) {
    await executor.promoClick.create({
      data: {
        promoLinkId: promoLink.id,
        code: promoLink.code,
        type: promoLink.type,
        telegramUserId: telegramUserId ?? null,
        ip: meta.ip ?? null,
        userAgent: meta.userAgent ?? null,
      },
    })
  }

  private async generateUniqueCode(name: string) {
    const baseCode = normalizePromoCode(name).slice(0, 56)
    let code = baseCode
    let suffix = 2

    while (await this.prisma.promoLink.findUnique({ where: { code }, select: { id: true } })) {
      const suffixText = `_${suffix}`
      code = `${baseCode.slice(0, 64 - suffixText.length)}${suffixText}`
      suffix += 1
    }

    return code
  }

  private assertUrlConfig(type: PromoLinkType) {
    if (type !== PromoLinkType.PUBLIC_SITE && !env.TELEGRAM_BOT_USERNAME) {
      throw badRequest('TELEGRAM_BOT_USERNAME is required for Telegram promo links')
    }
  }
}

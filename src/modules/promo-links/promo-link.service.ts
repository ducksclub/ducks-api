import type { Prisma, PrismaClient } from '@prisma/client'
import { conflict, notFound } from '../../common/errors/app-error.js'
import { env } from '../../config/env.js'
import type {
  CreatePromoLinkDto,
  TelegramStartDto,
  TrackPromoClickDto,
  UpdatePromoLinkDto,
} from './promo-link.dto.js'

type PrismaExecutor = PrismaClient | Prisma.TransactionClient

type ActivePromoLink = {
  id: string
  code: string
  isActive: boolean
}

const transliterationMap: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ы: 'y',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

export const normalizePromoCode = (value: string): string => {
  const transliterated = value
    .trim()
    .toLowerCase()
    .split('')
    .map((char) => transliterationMap[char] ?? char)
    .join('')

  const code = transliterated
    .replace(/[^a-z0-9_-]+/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^[_-]+|[_-]+$/g, '')

  return code || 'promo'
}

export const buildPromoLinkUrl = (code: string): string => {
  if (env.TELEGRAM_BOT_USERNAME) {
    return `https://t.me/${env.TELEGRAM_BOT_USERNAME}/app?startapp=${encodeURIComponent(code)}`
  }

  const publicUrl = env.APP_PUBLIC_URL.replace(/\/+$/, '')
  return `${publicUrl}?promo=${encodeURIComponent(code)}`
}

const toPromoLinkResponse = <T extends { code: string; clicksCount: number; registrationsCount: number }>(
  promoLink: T,
) => ({
  ...promoLink,
  url: buildPromoLinkUrl(promoLink.code),
  conversionRate:
    promoLink.clicksCount === 0
      ? 0
      : Number(((promoLink.registrationsCount / promoLink.clicksCount) * 100).toFixed(2)),
})

export class PromoLinkService {
  constructor(private readonly prisma: PrismaClient) {}

  async create(dto: CreatePromoLinkDto) {
    const code = dto.code ? normalizePromoCode(dto.code) : await this.generateUniqueCode(dto.name)

    const existing = await this.prisma.promoLink.findUnique({ where: { code } })
    if (existing) throw conflict('Promo code already exists')

    const promoLink = await this.prisma.promoLink.create({
      data: {
        name: dto.name,
        code,
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

  async update(id: string, dto: UpdatePromoLinkDto) {
    const exists = await this.prisma.promoLink.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!exists) throw notFound('Promo link not found')

    const promoLink = await this.prisma.promoLink.update({
      where: { id },
      data: Object.fromEntries(Object.entries(dto).filter(([, value]) => value !== undefined)),
      select: promoLinkSelect,
    })

    return toPromoLinkResponse(promoLink)
  }

  async trackClick(dto: TrackPromoClickDto) {
    const promoLink = await this.prisma.promoLink.findUnique({
      where: { code: dto.code },
      select: { id: true, code: true, isActive: true },
    })

    if (!promoLink?.isActive) {
      return {
        success: false,
        message: 'Promo link not found or inactive',
      }
    }

    await this.prisma.promoLink.update({
      where: { id: promoLink.id },
      data: { clicksCount: { increment: 1 } },
    })

    return {
      success: true,
      code: promoLink.code,
    }
  }

  async telegramStart(dto: TelegramStartDto) {
    return this.prisma.$transaction(async (tx) => {
      const promoLink = await tx.promoLink.findUnique({
        where: { code: dto.promoCode },
        select: { id: true, code: true, isActive: true },
      })

      if (!promoLink?.isActive) {
        return {
          success: false,
          message: 'Promo link not found or inactive',
        }
      }

      await tx.promoLink.update({
        where: { id: promoLink.id },
        data: { clicksCount: { increment: 1 } },
      })

      const user = await tx.user.findUnique({
        where: { telegramId: dto.telegramUserId },
        select: { id: true, promoLinkId: true, sourceCode: true },
      })

      let userLinked = false

      if (user && !user.promoLinkId && !user.sourceCode) {
        const result = await this.attachPromoToExistingUser(tx, user.id, promoLink)
        userLinked = result.userLinked
      }

      if (!user) {
        await tx.promoStartSession.upsert({
          where: { telegramUserId: dto.telegramUserId },
          update: {
            promoCode: promoLink.code,
            promoLinkId: promoLink.id,
          },
          create: {
            telegramUserId: dto.telegramUserId,
            promoCode: promoLink.code,
            promoLinkId: promoLink.id,
          },
        })
      }

      return {
        success: true,
        code: promoLink.code,
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
        select: { id: true, code: true, isActive: true },
      })

      if (promoLink?.isActive) return promoLink
    }

    if (!telegramUserId) return null

    const session = await executor.promoStartSession.findUnique({
      where: { telegramUserId },
      select: {
        promoCode: true,
        promoLink: {
          select: { id: true, code: true, isActive: true },
        },
      },
    })

    if (session?.promoLink?.isActive) return session.promoLink

    if (session?.promoCode) {
      const promoLink = await executor.promoLink.findUnique({
        where: { code: session.promoCode },
        select: { id: true, code: true, isActive: true },
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
      },
      data: {
        promoLinkId: promoLink.id,
        sourceCode: promoLink.code,
      },
    })

    if (result.count > 0) {
      await this.incrementRegistration(executor, promoLink.id)
    }

    return {
      userLinked: result.count > 0,
    }
  }

  private async generateUniqueCode(name: string) {
    const baseCode = normalizePromoCode(name)
    let code = baseCode
    let suffix = 2

    while (await this.prisma.promoLink.findUnique({ where: { code }, select: { id: true } })) {
      code = `${baseCode}_${suffix}`
      suffix += 1
    }

    return code
  }
}

const promoLinkSelect = {
  id: true,
  name: true,
  code: true,
  clicksCount: true,
  registrationsCount: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const

import type { PrismaClient } from '@prisma/client'
import { notFound } from '../../common/errors/app-error'
import { UpdateProfileDto } from './users.schemas'
import { PromoLinkService } from '../promo-links/promo-link.service'

export type CreateUserDto = {
  telegramId: string
  name?: string | null
  promoCode?: string | null
  sourceCode?: string | null
}

export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        avatarUrl: true,
        telegramId: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        promoLinkId: true,
        sourceCode: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        ratings: { select: { gameType: true, points: true } },
      },
    })
    if (!user) throw notFound('User not found')
    return user
  }

  async updateProfile(dto: UpdateProfileDto, userId: string) {
    const data = Object.fromEntries(
      Object.entries({
        name: dto.name,
        phone: dto.phone,
        username: dto.username,
        avatarUrl: dto.avatarUrl,
        avatarHash: dto.avatarHash,
      }).filter(([, v]) => v !== undefined),
    )

    const user = await this.prisma.user.update({
      data,
      where: { id: userId },
      select: {
        id: true,
        avatarUrl: true,
        telegramId: true,
        email: true,
        name: true,
        role: true,
        phone: true,
        promoLinkId: true,
        sourceCode: true,
        username: true,
        createdAt: true,
        updatedAt: true,
        ratings: { select: { gameType: true, points: true } },
      },
    })
    if (!user) throw notFound('User not found')
    return user
  }

  async getProfileByTelegramId(telegramId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        telegramId: telegramId,
      },
    })

    if (!user) throw notFound('User not found')
    return user
  }

  async createUserService(data: CreateUserDto) {
    const { telegramId, name } = data
    const promoLinkService = new PromoLinkService(this.prisma)
    const explicitPromoCode = data.promoCode ?? data.sourceCode ?? null

    const user = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { telegramId },
        select: { id: true, promoLinkId: true, sourceCode: true },
      })

      const promoLink = await promoLinkService.findActivePromoForRegistration(
        tx,
        explicitPromoCode,
        telegramId,
      )

      if (existing) {
        if (promoLink && !existing.promoLinkId && !existing.sourceCode) {
          await promoLinkService.attachPromoToExistingUser(tx, existing.id, promoLink)
        }

        return tx.user.update({
          where: { telegramId },
          data: {
            ...(name ? { name } : {}),
          },
        })
      }

      const createdUser = await tx.user.create({
        data: {
          telegramId,
          name: name ?? null,
          username: telegramId,

          /**
           * system email for telegram-only users
           */
          email: `tg_${telegramId}@duck.local`,

          passwordHash: 'telegram-auth',
          promoLinkId: promoLink?.id ?? null,
          sourceCode: promoLink?.code ?? null,
        },
      })

      if (promoLink) {
        await promoLinkService.incrementRegistration(tx, promoLink.id)
      }

      return createdUser
    })

    return user
  }
}

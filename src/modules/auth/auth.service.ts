import type { PrismaClient } from '@prisma/client'
import { conflict, unauthorized } from '../../common/errors/app-error.js'
import { Roles, type Role } from '../../common/types/domain.js'
import { hashPassword, verifyPassword } from '../../common/utils/password.js'
import { signAccessToken } from '../../common/utils/jwt.js'
import type { LoginDto, RegisterDto, TelegramUserDto } from './auth.schemas.js'
import { generateToken } from '../../common/utils/telegram-auth.js'
import { PromoLinkService } from '../promo-links/promo-link.service.js'

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  phone: true,
  sourceCode: true,
  promoLinkId: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async register(dto: RegisterDto, telegramUser?: TelegramUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw conflict('Email is already registered')

    const promoLinkService = new PromoLinkService(this.prisma)
    const telegramId = telegramUser?.id ? String(telegramUser.id) : null
    const explicitPromoCode = dto.promoCode ?? dto.sourceCode ?? null
    const passwordHash = await hashPassword(dto.password)

    const user = await this.prisma.$transaction(async (tx) => {
      const promoLink = await promoLinkService.findActivePromoForRegistration(
        tx,
        explicitPromoCode,
        telegramId,
      )

      const createdUser = await tx.user.create({
        data: {
          telegramId,
          email: dto.email,
          name: dto.name ?? null,
          phone: dto.phone ?? null,
          passwordHash,
          role: Roles.user,
          promoLinkId: promoLink?.id ?? null,
          sourceCode: promoLink?.code ?? null,
        },
        select: publicUserSelect,
      })

      if (promoLink) {
        await promoLinkService.incrementRegistration(tx, promoLink.id)
      }

      return createdUser
    })

    return {
      user,
      token: signAccessToken({ id: user.id, email: user.email, role: user.role as Role }),
    }
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw unauthorized('Invalid email or password')
    }

    const publicUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      sourceCode: user.sourceCode,
      promoLinkId: user.promoLinkId,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return {
      user: publicUser,
      token: signAccessToken({ id: user.id, email: user.email, role: user.role as Role }),
    }
  }

  async telegramLogin(telegramUser: TelegramUserDto) {
    const telegramId = String(telegramUser.id)

    let user = await this.prisma.user.findUnique({
      where: {
        telegramId: telegramId,
      },
    })

    /**
     * привязка телеграм аккаунта
     */
    if (!user) {
      const promoLinkService = new PromoLinkService(this.prisma)
      const passwordHash = await hashPassword('telegram-password')

      user = await this.prisma.$transaction(async (tx) => {
        const promoLink = await promoLinkService.findActivePromoForRegistration(tx, null, telegramId)

        const createdUser = await tx.user.create({
          data: {
            telegramId: telegramId,
            name: telegramUser.first_name,
            email: `tg_${telegramId}@telegram.local`,
            passwordHash,
            promoLinkId: promoLink?.id ?? null,
            sourceCode: promoLink?.code ?? null,
          },
        })

        if (promoLink) {
          await promoLinkService.incrementRegistration(tx, promoLink.id)
        }

        return createdUser
      })
    }

    const token = generateToken({
      id: user.id,
      role: user.role,
    })

    return {
      token,
      user,
    }
  }
}

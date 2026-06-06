import { toPublicUser } from './auth.helpers'
import { Roles } from '../../common/types/domain'
import { AuthRepository } from './auth.repository'
import { conflict, unauthorized } from '../../common/errors/app-error'
import { hashPassword, verifyPassword } from '../../common/utils/password'
import { signAccessToken } from '../../common/utils/jwt'
import { generateToken } from '../../common/utils/telegram-auth'
import { PromoLinkService } from '../promo-links/promo-link.service'
import { SignInDto, SignUpDto, TelegramWebAppUserDto } from './auth.types'
import type { Role } from '../../common/types/domain'
import type { PrismaClient } from '@prisma/client'
import { WarmupService } from '../warmups/warmup.service'

export class AuthService {
  private readonly repository: AuthRepository
  private readonly promoLinks: PromoLinkService
  private readonly warmupService: WarmupService

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new AuthRepository(prisma)
    this.promoLinks = new PromoLinkService(prisma)
    this.warmupService = new WarmupService(prisma)
  }

  async signIn(dto: SignInDto, telegramWebAppUser?: TelegramWebAppUserDto) {
    const user = await this.repository.findByEmail(dto.email)
    const passwordValid = user ? await verifyPassword(dto.password, user.passwordHash) : false

    if (!user || !passwordValid) {
      throw unauthorized('Неверный адрес электронной почты или пароль')
    }

    let signedInUser = user

    if (!user.telegramId) {
      const telegramId = telegramWebAppUser?.id ? String(telegramWebAppUser.id) : null
      signedInUser = telegramId
        ? await this.repository.attachTelegramIdToUser(user.id, telegramId)
        : user
    }

    const publicUser = toPublicUser(signedInUser)

    await this.warmupService.startAbandonedRegistrationWarmup(signedInUser.id)

    return {
      user: publicUser,
      token: signAccessToken({
        id: signedInUser.id,
        email: signedInUser.email,
        role: signedInUser.role as Role,
      }),
    }
  }

  async signUp(dto: SignUpDto, telegramWebAppUser?: TelegramWebAppUserDto) {
    const existing = await this.repository.findByEmail(dto.email)

    if (existing) {
      throw conflict('Адрес электронной почты уже зарегистрирован')
    }

    const telegramId = telegramWebAppUser?.id ? String(telegramWebAppUser.id) : null

    const explicitPromoCode = dto.promoCode ?? dto.sourceCode ?? null
    const passwordHash = await hashPassword(dto.password)

    const user = await this.prisma.$transaction(async (tx) => {
      const promoLink = await this.promoLinks.findActivePromoForRegistration(
        tx,
        explicitPromoCode,
        telegramId,
      )

      const createdUser = await this.repository.createUser(tx, {
        telegramId,
        passwordHash,
        avatarUrl: null,
        role: Roles.user,
        email: dto.email,
        username: dto.username,
        phone: dto.phone ?? null,
        promoLinkId: promoLink?.id ?? null,
        sourceCode: promoLink?.code ?? null,
        sourceType: promoLink?.type ?? null,
      })

      if (promoLink) {
        await this.promoLinks.incrementRegistration(tx, promoLink.id)
      }

      return createdUser
    })

    await this.warmupService.startAbandonedRegistrationWarmup(user.id)

    return {
      user,
      token: signAccessToken({
        id: user.id,
        email: user.email,
        role: user.role as Role,
      }),
    }
  }

  async signInWithTelegram(tgUserWebAppDto: TelegramWebAppUserDto, promoCode?: string | null) {
    const telegramId = String(tgUserWebAppDto.id)

    let user = await this.repository.findByTelegramId(telegramId)

    if (user && !user.promoLinkId && !user.sourceCode && !user.sourceType) {
      const userId = user.id

      await this.prisma.$transaction(async (tx) => {
        const promoLink = await this.promoLinks.findActivePromoForRegistration(
          tx,
          promoCode,
          telegramId,
        )

        if (promoLink) {
          await this.promoLinks.attachPromoToExistingUser(tx, userId, promoLink)
        }
      })

      user = await this.repository.findByTelegramId(telegramId)
    }

    /**
     * привязка телеграм аккаунта
     */
    if (!user) {
      const passwordHash = await hashPassword('telegram-password')

      user = await this.prisma.$transaction(async (tx) => {
        const promoLink = await this.promoLinks.findActivePromoForRegistration(
          tx,
          promoCode,
          telegramId,
        )

        const createdUser = await this.repository.createUser(tx, {
          telegramId,
          passwordHash,
          role: Roles.user,
          username: tgUserWebAppDto.first_name ?? `tg_user_${telegramId}`,
          email: `tg_${telegramId}@telegram.local`,
          promoLinkId: promoLink?.id ?? null,
          sourceCode: promoLink?.code ?? null,
          sourceType: promoLink?.type ?? null,
          phone: null,
          avatarUrl: null,
        })

        if (promoLink) {
          await this.promoLinks.incrementRegistration(tx, promoLink.id)
        }

        return createdUser
      })
    }

    const token = generateToken({
      id: user!.id,
      role: user!.role,
    })

    await this.warmupService.startAbandonedRegistrationWarmup(user.id)

    return {
      token,
      user,
    }
  }
}

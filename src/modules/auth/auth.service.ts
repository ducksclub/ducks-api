import { WarmupService } from '../warmups/warmup.service'
import { AuthEmailService } from './auth-email.service'
import { AuthRepository } from './auth.repository'
import { createRemoteJWKSet, jwtVerify } from 'jose'

import { Roles } from '../../common/types/domain'
import {
  buildPasswordResetUrl,
  createPasswordResetToken,
  hashPasswordResetToken,
  toPublicUser,
} from './auth.helpers'
import { signAccessToken } from '../../common/utils/jwt'
import {
  badRequest,
  conflict,
  internalServerError,
  unauthorized,
} from '../../common/errors/app-error'
import { hashPassword, verifyPassword } from '../../common/utils/password'

import type { Role } from '../../common/types/domain'
import { type PrismaClient } from '@prisma/client'
import type {
  ForgotPasswordDto,
  NicknameAvailabilityDto,
  ResetPasswordDto,
  SignInDto,
  SignInWithTelegramDto,
  SignUpDto,
} from './auth.types'
import { env } from '../../config/env'

const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000
const PASSWORD_RESET_REQUEST_MESSAGE = 'Мы отправили письмо для восстановления пароля'
const PASSWORD_RESET_FAILED_REQUEST_MESSAGE = 'Аккаунт с указанной почтой не найден'

export class AuthService {
  private readonly repository: AuthRepository
  private readonly warmupService: WarmupService
  private readonly emailService = new AuthEmailService()

  constructor(private readonly prisma: PrismaClient) {
    this.repository = new AuthRepository(prisma)
    this.warmupService = new WarmupService(prisma)
  }

  async signIn(dto: SignInDto) {
    const user = await this.repository.findByEmail(dto.email)
    const passwordValid = user ? await verifyPassword(dto.password, user.passwordHash) : false

    if (!user || !passwordValid) {
      throw unauthorized('Неверный адрес электронной почты или пароль')
    }

    const publicUser = toPublicUser(user)
    await this.warmupService.startAbandonedRegistrationWarmup(user.id)

    return {
      user: publicUser,
      token: signAccessToken({
        id: user.id,
        role: user.role as Role,
        email: user.email,
        nickname: user.nickname,
      }),
    }
  }

  async signUp(dto: SignUpDto) {
    const userExists = await this.repository.findByEmail(dto.email)
    if (userExists) throw conflict('Адрес электронной почты уже зарегистрирован')

    const nicknameExists = await this.repository.findByNickname(dto.nickname)
    if (nicknameExists) throw conflict('Nickname уже зарегистрирован')

    const passwordHash = await hashPassword(dto.password)
    const createdUser = await this.repository.createUser({
      role: Roles.user,
      email: dto.email,
      nickname: dto.nickname,
      phone: dto.phone ?? null,
      avatarUrl: null,
      telegramId: null,
      passwordHash,
    })

    await this.warmupService.startAbandonedRegistrationWarmup(createdUser.id)

    return {
      user: createdUser,
      token: signAccessToken({
        id: createdUser.id,
        role: createdUser.role as Role,
        email: createdUser.email,
        nickname: createdUser.nickname,
      }),
    }
  }

  async nicknameAvailability(dto: NicknameAvailabilityDto) {
    const user = await this.repository.findByNickname(dto.nickname)

    return {
      available: !user,
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.repository.findByEmail(dto.email)

    if (!user || user.email.endsWith('@telegram.local')) {
      return { message: PASSWORD_RESET_FAILED_REQUEST_MESSAGE }
    }

    const token = createPasswordResetToken()
    const tokenHash = hashPasswordResetToken(token)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS)

    await this.prisma.$transaction([
      this.prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      }),

      this.repository.createPasswordResetToken({
        userId: user.id,
        tokenHash,
        expiresAt,
      }),
    ])

    try {
      await this.emailService.sendPasswordResetMail({
        email: user.email,
        resetUrl: buildPasswordResetUrl(token),
      })
    } catch (error) {
      console.error('[AuthService] Password reset email failed', error)
      throw internalServerError('Не удалось отправить письмо для восстановления пароля')
    }

    return { message: PASSWORD_RESET_REQUEST_MESSAGE }
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenHash = hashPasswordResetToken(dto.token)
    const now = new Date()
    const token = await this.repository.findPasswordResetToken(tokenHash)

    if (!token || token.usedAt || token.expiresAt <= now) {
      throw badRequest('Ссылка для восстановления пароля недействительна или устарела')
    }

    const passwordHash = await hashPassword(dto.password)

    await this.prisma.$transaction(async (tx) => {
      const consumedToken = await tx.passwordResetToken.updateMany({
        where: {
          id: token.id,
          usedAt: null,
          expiresAt: {
            gt: now,
          },
        },
        data: {
          usedAt: now,
        },
      })

      if (consumedToken.count !== 1) {
        throw badRequest('Ссылка для восстановления пароля недействительна или устарела')
      }

      await tx.user.update({
        where: { id: token.userId },
        data: { passwordHash },
      })

      await tx.passwordResetToken.updateMany({
        where: {
          userId: token.userId,
          usedAt: null,
        },
        data: {
          usedAt: now,
        },
      })
    })

    return { message: 'Пароль успешно изменен' }
  }

  async signInWithTelegram(dto: SignInWithTelegramDto) {
    const JWKS = createRemoteJWKSet(new URL('https://oauth.telegram.org/.well-known/jwks.json'))

    const { payload } = await jwtVerify(dto.idToken, JWKS, {
      issuer: 'https://oauth.telegram.org',
      audience: env.TELEGRAM_CLIENT_ID,
    })

    return payload
    // try {
    //   const telegramId = String(dto.idToken)
    //   let user = await this.repository.findByTelegramId(telegramId)

    //   if (!user) {
    //     const nickname = await createAvailableTelegramNickname(
    //       dto?.username ?? `tg_user_${telegramId}`,
    //       telegramId,
    //       (nickname) => this.repository.findByNickname(nickname),
    //     )
    //     const passwordHash = await hashPassword('telegram-password')

    //     user = await this.repository.createUser({
    //       telegramId,
    //       passwordHash,
    //       role: Roles.user,
    //       email: `tg_${telegramId}@telegram.local`,
    //       nickname,
    //       phone: null,
    //       avatarUrl: null,
    //     })
    //   }

    //   const token = signAccessToken({
    //     id: user.id,
    //     role: user.role as Role,
    //     email: user.email,
    //     nickname: user.nickname,
    //   })

    //   await this.warmupService.startAbandonedRegistrationWarmup(user.id)

    //   return {
    //     token,
    //     user,
    //   }
    // } catch (error) {
    //   if (error instanceof AppError) {
    //     throw error
    //   }

    //   if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
    //     throw conflict('Пользователь с такими данными уже существует')
    //   }

    //   console.error('[AuthService] Telegram sign-in failed', error)
    //   throw internalServerError('Не удалось авторизоваться через Telegram')
    // }
  }
}

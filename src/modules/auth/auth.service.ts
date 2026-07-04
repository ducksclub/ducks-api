import { WarmupService } from '../warmups/warmup.service'
import { AuthEmailService } from './auth-email.service'
import { AuthRepository } from './auth.repository'
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose'

import { Roles } from '../../common/types/domain'
import {
  buildPasswordResetUrl,
  createAvailableTelegramNickname,
  createPasswordResetToken,
  getOptionalStringClaim,
  getRequiredTelegramIdClaim,
  hashPasswordResetToken,
  isTelegramTokenError,
  toPublicUser,
} from './auth.helpers'
import { signAccessToken } from '../../common/utils/jwt'
import {
  AppError,
  badRequest,
  conflict,
  internalServerError,
  unauthorized,
} from '../../common/errors/app-error'
import { hashPassword, verifyPassword } from '../../common/utils/password'

import type { Role } from '../../common/types/domain'
import { Prisma, type PrismaClient } from '@prisma/client'
import type {
  ForgotPasswordDto,
  NicknameAvailabilityDto,
  ResetPasswordDto,
  SignInDto,
  SignInWithTelegramOidcDto,
  SignInWithTelegramDto,
  SignUpDto,
} from './auth.types'
import { env } from '../../config/env'

const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000
const PASSWORD_RESET_REQUEST_MESSAGE = 'Мы отправили письмо для восстановления пароля'
const PASSWORD_RESET_FAILED_REQUEST_MESSAGE = 'Аккаунт с указанной почтой не найден'
const TELEGRAM_ISSUER = 'https://oauth.telegram.org'
const TELEGRAM_TOKEN_ENDPOINT = 'https://oauth.telegram.org/token'
const TELEGRAM_JWKS = createRemoteJWKSet(
  new URL('https://oauth.telegram.org/.well-known/jwks.json'),
)

type TelegramTokenResponse = {
  access_token?: string
  token_type?: string
  expires_in?: number
  id_token?: string
}

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
    try {
      const payload = await this.verifyTelegramIdToken(dto.idToken)

      return await this.signInWithVerifiedTelegramPayload(payload)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('Пользователь с такими данными уже существует')
      }

      if (isTelegramTokenError(error)) {
        throw unauthorized('Некорректные данные авторизации Telegram')
      }

      console.error('[AuthService] Telegram sign-in failed', error)
      throw internalServerError('Не удалось авторизоваться через Telegram')
    }
  }

  async signInWithTelegramOidc(dto: SignInWithTelegramOidcDto) {
    try {
      const idToken = await this.exchangeTelegramAuthorizationCode(dto)
      const payload = await this.verifyTelegramIdToken(idToken, dto.nonce)

      return await this.signInWithVerifiedTelegramPayload(payload)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('Пользователь с такими данными уже существует')
      }

      if (isTelegramTokenError(error)) {
        throw unauthorized('Telegram id_token не прошёл проверку')
      }

      console.error('[AuthService] Telegram OIDC sign-in failed', error)
      throw internalServerError('Не удалось авторизоваться через Telegram')
    }
  }

  private async exchangeTelegramAuthorizationCode(dto: SignInWithTelegramOidcDto) {
    const clientId = env.TELEGRAM_LOGIN_CLIENT_ID
    const clientSecret = env.TELEGRAM_LOGIN_CLIENT_SECRET

    if (!clientSecret) {
      throw internalServerError('Не настроен Telegram Login Client Secret')
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: dto.code,
      redirect_uri: dto.redirectUri,
      client_id: clientId,
      code_verifier: dto.codeVerifier,
    })
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    let response: Response

    try {
      response = await fetch(TELEGRAM_TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })
    } catch {
      throw badRequest('Telegram token exchange failed')
    }

    if (!response.ok) {
      throw badRequest('Telegram token exchange failed')
    }

    let tokenResponse: TelegramTokenResponse

    try {
      tokenResponse = (await response.json()) as TelegramTokenResponse
    } catch {
      throw badRequest('Telegram token exchange failed')
    }

    if (!tokenResponse.id_token) {
      throw unauthorized('Telegram id_token не прошёл проверку')
    }

    return tokenResponse.id_token
  }

  private async verifyTelegramIdToken(idToken: string, nonce?: string) {
    const { payload } = await jwtVerify(idToken, TELEGRAM_JWKS, {
      issuer: TELEGRAM_ISSUER,
      audience: env.TELEGRAM_LOGIN_CLIENT_ID,
    })

    if (nonce && payload.nonce !== nonce) {
      throw unauthorized('Telegram id_token не прошёл проверку')
    }

    return payload
  }

  private async signInWithVerifiedTelegramPayload(payload: JWTPayload) {
    const telegramId = getRequiredTelegramIdClaim(payload.id ?? payload.sub)
    const existingUser = await this.repository.findByTelegramId(telegramId)
    const avatarUrl = getOptionalStringClaim(payload.picture) ?? null

    if (existingUser) {
      const user =
        avatarUrl && avatarUrl !== existingUser.avatarUrl
          ? await this.repository.updateTelegramProfile(existingUser.id, { avatarUrl })
          : existingUser

      await this.warmupService.startAbandonedRegistrationWarmup(user.id)

      return {
        user,
        token: this.createAccessToken(user),
      }
    }

    const nickname = await createAvailableTelegramNickname(
      getOptionalStringClaim(payload.preferred_username) ??
        getOptionalStringClaim(payload.name) ??
        getOptionalStringClaim(payload.given_name) ??
        `tg_user_${telegramId}`,
      telegramId,
      (candidate) => this.repository.findByNickname(candidate),
    )
    const user = await this.repository.createUser({
      email: `tg_${telegramId}@telegram.local`,
      nickname,
      avatarUrl,
      passwordHash: await hashPassword('telegram-password'),
      phone: null,
      role: Roles.user,
      telegramId,
    })

    await this.warmupService.startAbandonedRegistrationWarmup(user.id)

    return {
      user,
      token: this.createAccessToken(user),
    }
  }

  private createAccessToken(user: { id: string; role: string; email: string; nickname: string }) {
    return signAccessToken({
      id: user.id,
      role: user.role as Role,
      email: user.email,
      nickname: user.nickname,
    })
  }
}

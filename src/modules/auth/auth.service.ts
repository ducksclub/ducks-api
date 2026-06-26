import { WarmupService } from '../warmups/warmup.service'
import { AuthRepository } from './auth.repository'

import { Roles } from '../../common/types/domain'
import { toPublicUser } from './auth.helpers'
import { signAccessToken } from '../../common/utils/jwt'
import { AppError, conflict, internalServerError, unauthorized } from '../../common/errors/app-error'
import { hashPassword, verifyPassword } from '../../common/utils/password'
import { createAvailableTelegramNickname } from './auth.helpers'

import type { Role } from '../../common/types/domain'
import { Prisma, type PrismaClient } from '@prisma/client'
import type {
  NicknameAvailabilityDto,
  SignInDto,
  SignUpDto,
  TelegramWebAppUserDto,
} from './auth.types'

export class AuthService {
  private readonly repository: AuthRepository
  private readonly warmupService: WarmupService

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

  async signInWithTelegram(dto: TelegramWebAppUserDto) {
    try {
      const telegramId = String(dto.id)
      let user = await this.repository.findByTelegramId(telegramId)

      if (!user) {
        const nickname = await createAvailableTelegramNickname(
          dto?.username ?? `tg_user_${telegramId}`,
          telegramId,
          (nickname) => this.repository.findByNickname(nickname),
        )
        const passwordHash = await hashPassword('telegram-password')

        user = await this.repository.createUser({
          telegramId,
          passwordHash,
          role: Roles.user,
          email: `tg_${telegramId}@telegram.local`,
          nickname,
          phone: null,
          avatarUrl: null,
        })
      }

      const token = signAccessToken({
        id: user.id,
        role: user.role as Role,
        email: user.email,
        nickname: user.nickname,
      })

      await this.warmupService.startAbandonedRegistrationWarmup(user.id)

      return {
        token,
        user,
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw conflict('Пользователь с такими данными уже существует')
      }

      console.error('[AuthService] Telegram sign-in failed', error)
      throw internalServerError('Не удалось авторизоваться через Telegram')
    }
  }
}

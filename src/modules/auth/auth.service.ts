import type { PrismaClient } from '@prisma/client'
import { conflict, unauthorized } from '../../common/errors/app-error.js'
import { Roles, type Role } from '../../common/types/domain.js'
import { hashPassword, verifyPassword } from '../../common/utils/password.js'
import { signAccessToken } from '../../common/utils/jwt.js'
import type { LoginDto, RegisterDto } from './auth.schemas.js'

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const

export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } })
    if (existing) throw conflict('Email is already registered')

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name ?? null,
        passwordHash: await hashPassword(dto.password),
        role: Roles.user,
      },
      select: publicUserSelect,
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
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }

    return {
      user: publicUser,
      token: signAccessToken({ id: user.id, email: user.email, role: user.role as Role }),
    }
  }
}

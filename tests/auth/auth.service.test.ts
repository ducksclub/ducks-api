import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Roles } from '../../src/common/types/domain.js'
import { AuthService } from '../../src/modules/auth/auth.service.js'

vi.mock('../../src/common/utils/password.js', () => ({
  hashPassword: vi.fn(async () => 'hashed-password'),
  verifyPassword: vi.fn(async (password: string) => password === 'Valid12345!'),
}))

vi.mock('../../src/common/utils/jwt.js', () => ({
  signAccessToken: vi.fn(() => 'jwt-token'),
}))

describe('AuthService', () => {
  const prisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers a new user and returns token', async () => {
    prisma.user.findUnique.mockResolvedValue(null)
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      name: 'User',
      role: Roles.user,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    const result = await new AuthService(prisma as never).register({
      email: 'user@example.com',
      password: 'Valid12345!',
      name: 'User',
    })

    expect(result.token).toBe('jwt-token')
    expect(result.user.email).toBe('user@example.com')
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ passwordHash: 'hashed-password' }),
      }),
    )
  })

  it('rejects invalid login credentials', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      passwordHash: 'hashed-password',
      role: Roles.user,
    })

    await expect(
      new AuthService(prisma as never).login({ email: 'user@example.com', password: 'wrong' }),
    ).rejects.toMatchObject({
      statusCode: 401,
    })
  })
})

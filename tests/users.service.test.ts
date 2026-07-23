import { describe, expect, it, vi } from 'vitest'
import type { PrismaClient } from '@prisma/client'
import { UsersService } from '../src/modules/users/users.service'

describe('UsersService admin game stats', () => {
  it('returns every game for every user and includes manual bounty adjustments', async () => {
    const findMany = vi.fn().mockResolvedValue([
      {
        id: 'user-1',
        telegramId: null,
        email: 'player@example.com',
        nickname: 'player',
        role: 'user',
        phone: null,
        avatarUrl: null,
        createdAt: new Date('2026-01-01'),
        updatedAt: new Date('2026-01-01'),
        ratings: [{ gameType: 'poker', points: 120, bountyAdjustment: -2 }],
        registrations: [
          { bounty: 5, event: { gameType: 'poker' } },
          { bounty: 3, event: { gameType: 'poker' } },
        ],
      },
    ])
    const prisma = { user: { findMany } } as unknown as PrismaClient

    const [profile] = await new UsersService(prisma).getProfiles()

    expect(profile?.ratings).toHaveLength(5)
    expect(profile?.ratings).toContainEqual({
      gameType: 'poker',
      points: 120,
      bounty: 6,
    })
    expect(profile?.ratings).toContainEqual({
      gameType: 'darts',
      points: 0,
      bounty: 0,
    })
  })

  it('sets absolute points and bounty without changing event results', async () => {
    const upsert = vi.fn().mockImplementation(({ create }) => Promise.resolve(create))
    const tx = {
      user: {
        findUnique: vi.fn().mockResolvedValue({ id: 'user-1' }),
      },
      eventRegistration: {
        aggregate: vi.fn().mockResolvedValue({ _sum: { bounty: 8 } }),
      },
      rating: {
        findUnique: vi.fn().mockResolvedValue({
          userId: 'user-1',
          gameType: 'poker',
          points: 120,
          bountyAdjustment: 0,
        }),
        upsert,
      },
    }
    const prisma = {
      $transaction: vi.fn().mockImplementation((callback) => callback(tx)),
    } as unknown as PrismaClient

    const result = await new UsersService(prisma).updateGameStats('user-1', 'poker', {
      points: 150,
      bounty: 3,
    })

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          points: 150,
          bountyAdjustment: -5,
        }),
      }),
    )
    expect(result).toEqual({
      userId: 'user-1',
      gameType: 'poker',
      points: 150,
      bounty: 3,
    })
  })
})

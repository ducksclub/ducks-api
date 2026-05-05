import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventStatuses, GameTypes, RegistrationStatuses } from '../../src/common/types/domain.js'
import { EventsService } from '../../src/modules/events/events.service.js'

describe('EventsService', () => {
  const tx = {
    event: { findUnique: vi.fn() },
    eventRegistration: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
    rating: { upsert: vi.fn() },
  }
  const prisma = {
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('registers user and awards participation points', async () => {
    tx.event.findUnique.mockResolvedValue({
      id: 'event-1',
      gameType: GameTypes.poker,
      status: EventStatuses.published,
      participantLimit: 2,
      pointsForParticipation: 10,
      _count: { registrations: 1 },
    })
    tx.eventRegistration.findUnique.mockResolvedValue(null)
    tx.eventRegistration.create.mockResolvedValue({
      id: 'registration-1',
      status: RegistrationStatuses.active,
    })
    tx.rating.upsert.mockResolvedValue({ id: 'rating-1', points: 10 })

    const result = await new EventsService(prisma as never).registerUser('event-1', 'user-1')

    expect(result).toMatchObject({ id: 'registration-1' })
    expect(tx.rating.upsert).toHaveBeenCalledWith({
      where: { userId_gameType: { userId: 'user-1', gameType: GameTypes.poker } },
      create: { userId: 'user-1', gameType: GameTypes.poker, points: 10 },
      update: { points: { increment: 10 } },
    })
  })

  it('rejects registration when participant limit is reached', async () => {
    tx.event.findUnique.mockResolvedValue({
      id: 'event-1',
      gameType: GameTypes.poker,
      status: EventStatuses.published,
      participantLimit: 2,
      pointsForParticipation: 10,
      _count: { registrations: 2 },
    })

    await expect(
      new EventsService(prisma as never).registerUser('event-1', 'user-1'),
    ).rejects.toMatchObject({ statusCode: 409 })
  })
})

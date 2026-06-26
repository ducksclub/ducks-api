import { beforeEach, describe, expect, it, vi } from 'vitest'
import { EventStatuses, GameTypes, RegistrationStatuses } from '../../src/common/types/domain.js'
import { EventsService } from '../../src/modules/events/core/events.service.js'

describe('EventsService', () => {
  const tx = {
    event: { findUnique: vi.fn() },
    eventRegistration: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    userWarmup: { updateMany: vi.fn() },
    rating: { upsert: vi.fn() },
  }
  const prisma = {
    $transaction: vi.fn(async (callback: (client: typeof tx) => unknown) => callback(tx)),
    event: tx.event,
    eventRegistration: tx.eventRegistration,
    userWarmup: tx.userWarmup,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
      }),
    )
    tx.user.findUnique.mockResolvedValue({ telegramId: '123456789' })
  })

  it('registers a non-poker user with the existing participant limit behavior', async () => {
    tx.event.findUnique.mockResolvedValue({
      id: 'event-1',
      gameType: GameTypes.darts,
      status: EventStatuses.published,
      title: 'Darts event',
      startsAt: new Date('2026-05-16T10:00:00.000Z'),
      address: 'DUCKS GameClub',
      participantLimit: 2,
      _count: { registrations: 1 },
    })
    tx.eventRegistration.findUnique.mockResolvedValue(null)
    tx.eventRegistration.create.mockResolvedValue({
      id: 'registration-1',
      status: RegistrationStatuses.registered,
    })

    const result = await new EventsService(prisma as never).registerUser('event-1', 'user-1')

    expect(result).toMatchObject({ id: 'registration-1' })
    expect(tx.eventRegistration.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        eventId: 'event-1',
        status: RegistrationStatuses.registered,
        tableNumber: null,
        seatNumber: null,
      },
    })
  })

  it('puts non-poker users into waiting list when participant limit is reached', async () => {
    tx.event.findUnique.mockResolvedValue({
      id: 'event-1',
      gameType: GameTypes.darts,
      status: EventStatuses.published,
      title: 'Darts event',
      startsAt: new Date('2026-05-16T10:00:00.000Z'),
      address: 'DUCKS GameClub',
      participantLimit: 2,
      _count: { registrations: 2 },
    })
    tx.eventRegistration.findUnique.mockResolvedValue(null)
    tx.eventRegistration.create.mockResolvedValue({
      id: 'registration-1',
      status: RegistrationStatuses.waiting,
      createdAt: new Date('2026-05-16T09:00:00.000Z'),
    })
    tx.eventRegistration.count.mockResolvedValue(0)

    const result = await new EventsService(prisma as never).registerUser('event-1', 'user-1')

    expect(result).toMatchObject({
      id: 'registration-1',
      status: RegistrationStatuses.waiting,
      isWaiting: true,
      waitingPosition: 1,
    })
    expect(tx.eventRegistration.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        eventId: 'event-1',
        status: RegistrationStatuses.waiting,
        tableNumber: null,
        seatNumber: null,
      },
    })
  })

  it('assigns poker seats by table and seat order', async () => {
    tx.event.findUnique.mockResolvedValue({
      id: 'event-1',
      gameType: GameTypes.poker,
      status: EventStatuses.published,
      title: 'Poker event',
      startsAt: new Date('2026-05-16T10:00:00.000Z'),
      address: 'DUCKS GameClub',
      participantLimit: 20,
      seatsPerTable: 9,
      _count: { registrations: 9 },
    })
    tx.eventRegistration.findUnique.mockResolvedValue(null)
    tx.eventRegistration.findMany.mockResolvedValue(
      Array.from({ length: 9 }, (_, index) => ({
        tableNumber: 1,
        seatNumber: index + 1,
      })),
    )
    tx.eventRegistration.create.mockResolvedValue({
      id: 'registration-1',
      status: RegistrationStatuses.registered,
      tableNumber: 2,
      seatNumber: 1,
    })

    const result = await new EventsService(prisma as never).registerUser('event-1', 'user-1')

    expect(result).toMatchObject({
      status: RegistrationStatuses.registered,
      tableNumber: 2,
      seatNumber: 1,
      isWaiting: false,
    })
    expect(tx.eventRegistration.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        eventId: 'event-1',
        status: RegistrationStatuses.registered,
        tableNumber: 2,
        seatNumber: 1,
      },
    })
  })

  it('puts poker users into waiting list when all table seats are occupied', async () => {
    tx.event.findUnique.mockResolvedValue({
      id: 'event-1',
      gameType: GameTypes.poker,
      status: EventStatuses.published,
      title: 'Poker event',
      startsAt: new Date('2026-05-16T10:00:00.000Z'),
      address: 'DUCKS GameClub',
      participantLimit: 2,
      seatsPerTable: 9,
      _count: { registrations: 2 },
    })
    tx.eventRegistration.findUnique.mockResolvedValue(null)
    tx.eventRegistration.findMany.mockResolvedValue([
      { tableNumber: 1, seatNumber: 1 },
      { tableNumber: 1, seatNumber: 2 },
    ])
    tx.eventRegistration.create.mockResolvedValue({
      id: 'registration-1',
      status: RegistrationStatuses.waiting,
      tableNumber: null,
      seatNumber: null,
      createdAt: new Date('2026-05-16T09:00:00.000Z'),
    })
    tx.eventRegistration.count.mockResolvedValue(0)

    const result = await new EventsService(prisma as never).registerUser('event-1', 'user-1')

    expect(result).toMatchObject({
      status: RegistrationStatuses.waiting,
      tableNumber: null,
      seatNumber: null,
      isWaiting: true,
      waitingPosition: 1,
    })
    expect(tx.eventRegistration.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        eventId: 'event-1',
        status: RegistrationStatuses.waiting,
        tableNumber: null,
        seatNumber: null,
      },
    })
  })

  it('promotes first waiting poker user when a registered user cancels', async () => {
    tx.event.findUnique.mockResolvedValue({
      id: 'event-1',
      gameType: GameTypes.poker,
      title: 'Poker event',
      startsAt: new Date('2026-05-16T10:00:00.000Z'),
      address: 'DUCKS GameClub',
      participantLimit: 2,
      seatsPerTable: 9,
    })
    tx.eventRegistration.findUnique.mockResolvedValue({
      id: 'registration-1',
      eventId: 'event-1',
      status: RegistrationStatuses.registered,
      tableNumber: 1,
      seatNumber: 2,
    })
    tx.eventRegistration.update
      .mockResolvedValueOnce({ id: 'registration-1', status: RegistrationStatuses.cancelled })
      .mockResolvedValueOnce({ id: 'registration-2', status: RegistrationStatuses.registered })
    tx.eventRegistration.findFirst.mockResolvedValue({
      id: 'registration-2',
      status: RegistrationStatuses.waiting,
    })

    await new EventsService(prisma as never).cancelRegistration('event-1', 'user-1')

    expect(tx.eventRegistration.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'registration-2' },
      data: {
        status: RegistrationStatuses.registered,
        tableNumber: 1,
        seatNumber: 2,
        cancelledAt: null,
      },
    })
  })

  it('hides assigned poker seat until 15 minutes before the event', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-16T10:00:00.000Z'))

    tx.event.findUnique.mockResolvedValue({
      id: 'event-1',
      gameType: GameTypes.poker,
      seatsPerTable: 9,
      startsAt: new Date('2026-05-16T10:30:00.000Z'),
    })
    tx.eventRegistration.findUnique.mockResolvedValue({
      id: 'registration-1',
      status: RegistrationStatuses.registered,
      tableNumber: 1,
      seatNumber: 1,
      createdAt: new Date('2026-05-16T09:00:00.000Z'),
    })

    const result = await new EventsService(prisma as never).getMySeat('event-1', 'user-1')

    expect(result).toEqual({
      status: 'HIDDEN_UNTIL_15_MIN',
      message: 'Место будет доступно за 15 минут до начала игры',
      availableAt: '2026-05-16T10:15:00.000Z',
    })
  })
})

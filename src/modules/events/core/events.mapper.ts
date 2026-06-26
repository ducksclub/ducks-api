import type { Prisma } from '@prisma/client'
import { getPokerSeatLayout, isPokerEvent } from '../poker-seats/poker-seats.helper.js'
import type {
  CreateEventDto,
  EventReminderType,
  PokerSeatLayoutEvent,
  UpdateEventDto,
} from '../events.types.js'

export function mapCreateEventData(dto: CreateEventDto): Prisma.EventCreateInput {
  return {
    title: dto.title,
    city: dto.city,
    features: dto.features,
    gameRules: dto.gameRules,
    address: dto.address,
    gameType: dto.gameType,
    startsAt: dto.startsAt,
    endsAt: dto.endsAt ?? null,
    participantLimit: dto.participantLimit,
    seatsPerTable: dto.seatsPerTable,
    initialDepositAmount: dto.initialDepositAmount,
    status: dto.status,
    isTemplate: dto.isTemplate ?? false,
    imageUrl: dto.imageUrl ?? null,
    imageHash: dto.imageHash ?? null,
  }
}

export function mapUpdateEventData(dto: UpdateEventDto): Prisma.EventUpdateInput {
  return {
    ...(dto.title !== undefined && { title: dto.title }),
    ...(dto.city !== undefined && { city: dto.city }),
    ...(dto.address !== undefined && { address: dto.address }),
    ...(dto.gameRules !== undefined && { gameRules: dto.gameRules }),
    ...(dto.features !== undefined && { features: dto.features }),
    ...(dto.gameType !== undefined && { gameType: dto.gameType }),
    ...(dto.startsAt !== undefined && { startsAt: dto.startsAt }),
    ...(dto.endsAt !== undefined && { endsAt: dto.endsAt }),
    ...(dto.participantLimit !== undefined && {
      participantLimit: dto.participantLimit,
    }),
    ...(dto.seatsPerTable !== undefined && {
      seatsPerTable: dto.seatsPerTable,
    }),
    ...(dto.initialDepositAmount !== undefined && {
      initialDepositAmount: dto.initialDepositAmount,
    }),
    ...(dto.status !== undefined && { status: dto.status }),
    ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
    ...(dto.imageHash !== undefined && { imageHash: dto.imageHash }),
  }
}

export function mapEventWithPokerSeatLayout<T extends PokerSeatLayoutEvent>(event: T) {
  if (!isPokerEvent(event.gameType)) return event

  return {
    ...event,
    tableCount: getPokerSeatLayout(event.participantLimit, event.seatsPerTable).tableCount,
  }
}

export function mapEventReminderResponse(
  event: {
    id: string
    address: string
    gameType: string
    initialDepositAmount: number
    startsAt: Date
    registrations: Array<{ user: { telegramId: string | null } }>
  },
  type: EventReminderType,
) {
  return {
    id: event.id,
    address: event.address,
    gameType: event.gameType,
    initialDepositAmount: event.initialDepositAmount,
    startsAt: event.startsAt,
    reminderType: type,
    participants: event.registrations.map((registration) => ({
      telegramId: registration.user.telegramId,
    })),
  }
}

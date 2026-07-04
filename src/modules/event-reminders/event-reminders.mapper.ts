import { ReminderType } from "../../common/types/domain"

export function mapEventReminderResponse(
  event: {
    id: string
    address: string
    gameType: string
    initialDepositAmount: number
    startsAt: Date
    registrations: Array<{ user: { telegramId: string | null } }>
  },
  type: ReminderType,
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

export type ReminderType = '24h' | '2h' | '15m'

export type ReminderConfig = {
  type: ReminderType
  amount: number
  unit: 'hour' | 'minute'
  sentField: 'reminderSent24h' | 'reminderSent2h' | 'reminderSent15m'
}

export const EVENT_REMINDERS: ReminderConfig[] = [
  {
    type: '24h',
    amount: 24,
    unit: 'hour',
    sentField: 'reminderSent24h',
  },
  {
    type: '2h',
    amount: 2,
    unit: 'hour',
    sentField: 'reminderSent2h',
  },
  {
    type: '15m',
    amount: 15,
    unit: 'minute',
    sentField: 'reminderSent15m',
  },
]

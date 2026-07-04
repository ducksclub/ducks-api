import { RegistrationStatuses } from '../../common/types/domain'
import type { EventListQuery } from '../events/events.types'

export function buildMyEventListWhere(query: EventListQuery, userId: string) {
  return {
    ...(query.gameType && {
      gameType: query.gameType,
    }),
    ...(query.status && {
      status: query.status,
    }),
    registrations: {
      some: {
        userId,
        status: {
          in: [RegistrationStatuses.registered, RegistrationStatuses.waiting],
        },
      },
    },
  }
}

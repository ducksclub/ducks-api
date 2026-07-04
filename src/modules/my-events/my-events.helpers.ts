import { MyEventsQuery } from './my-events.types'
import { RegistrationStatuses } from '../../common/types/domain'

export function buildMyEventListWhere(query: MyEventsQuery, userId: string) {
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

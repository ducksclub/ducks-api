import { RegistrationStatuses } from '../../../common/types/domain.js'
import type { EventListQuery } from '../events.types.js'

export function buildEventListWhere(query: EventListQuery, isTemplate: boolean) {
  return {
    isTemplate,
    ...(query.gameType && { gameType: query.gameType }),
    ...(query.status && { status: query.status }),
  }
}

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

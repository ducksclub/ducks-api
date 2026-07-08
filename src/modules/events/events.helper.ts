import type { EventListQuery } from './events.types.js'

export function buildEventListWhere(query: EventListQuery, isTemplate: boolean) {
  return {
    isTemplate,
    ...(query.gameType && { gameType: query.gameType }),
    ...(query.status && { status: query.status }),
  }
}

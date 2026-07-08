import {
  EVENT_SCORING_BASE_POINTS,
  EVENT_SCORING_DEFAULT_MULTIPLIER,
  EVENT_SCORING_DEFAULT_POINTS,
  EVENT_SCORING_MULTIPLIERS,
} from '../events/events.constants.js'

export function calculatePoints(position: number, playersCount: number): number {
  const base = getBasePoints(position)
  const multiplier = getMultiplier(playersCount)

  return Math.round(base * multiplier)
}

function getBasePoints(position: number): number {
  return (
    EVENT_SCORING_BASE_POINTS.find(({ maxPosition }) => position <= maxPosition)?.points ??
    EVENT_SCORING_DEFAULT_POINTS
  )
}

function getMultiplier(playersCount: number): number {
  return (
    EVENT_SCORING_MULTIPLIERS.find(({ maxPlayers }) => playersCount <= maxPlayers)?.multiplier ??
    EVENT_SCORING_DEFAULT_MULTIPLIER
  )
}

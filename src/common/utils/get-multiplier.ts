export const getMultiplier = (playersCount: number): number => {
  if (playersCount <= 20) return 1.0
  if (playersCount <= 35) return 1.2
  if (playersCount <= 50) return 1.5
  if (playersCount <= 65) return 1.8
  if (playersCount <= 80) return 2.0

  return 2.0 // fallback
}

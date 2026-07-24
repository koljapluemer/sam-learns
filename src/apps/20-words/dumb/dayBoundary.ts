// The learner's day starts at 4am local time, not midnight - so a word added
// at 1am still counts toward the previous day's 20-word goal. Shifting the
// timestamp back 4h before deriving the calendar day gives that boundary.
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000

export function toDayKey(isoTimestamp: string): string {
  const shifted = new Date(new Date(isoTimestamp).getTime() - FOUR_HOURS_MS)
  const year = shifted.getFullYear()
  const month = String(shifted.getMonth() + 1).padStart(2, '0')
  const day = String(shifted.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

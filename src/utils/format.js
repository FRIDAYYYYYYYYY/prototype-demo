/** Minutes in the API payloads are offsets from the booked base clock (10:00). */
export const BASE_MINUTE = 10 * 60

/** Render a minute offset as a wall clock label, e.g. 15 -> '10:15'. */
export function formatMinute(minute) {
  if (minute === null || minute === undefined || Number.isNaN(Number(minute))) {
    return '--:--'
  }
  const absolute = BASE_MINUTE + Math.round(Number(minute))
  const hours = Math.floor(absolute / 60) % 24
  const minutes = ((absolute % 60) + 60) % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

/** 'on time' / '+12 min' */
export function formatDelay(minutes) {
  const value = Number(minutes) || 0
  if (value <= 0) {
    return 'on time'
  }
  return `+${value} min`
}

/** Human readable label for the schedule currently on the dispatcher's desk. */
export const SCHEDULE_LABELS = {
  baseline: 'Booked timetable',
  legacy_cascade: 'Legacy cascade',
  rule_based: 'Rule engine plan',
  optimized: 'CP-SAT re-plan',
}

export function scheduleLabel(name) {
  return SCHEDULE_LABELS[name] || name || 'unknown'
}

/** Green / red / amber tone used across chips and cards. */
export function delayTone(minutes) {
  const value = Number(minutes) || 0
  if (value <= 0) return 'success'
  if (value <= 5) return 'warning'
  return 'error'
}

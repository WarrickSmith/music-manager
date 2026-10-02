/**
 * Upload deadlines. A competition may have a date and time after which
 * competitors can no longer upload, replace or delete their music. Admins are
 * never locked out. The deadline is stored as an ISO timestamp (UTC) and shown
 * in the viewer's own time zone.
 */

export type DeadlineState = 'none' | 'open' | 'closing-soon' | 'closed'

/** Within this many hours of the deadline, the screen warns that it is close */
export const CLOSING_SOON_HOURS = 72

export interface DeadlineStatus {
  state: DeadlineState
  closesAt: Date | null
  /** Short text for badges and notices, e.g. "Closes in 2 days 3 hours" */
  label: string
}

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR

/** "2 days 3 hours", "5 hours", "12 minutes" */
export function formatRemaining(ms: number): string {
  if (ms <= 0) return '0 minutes'
  const days = Math.floor(ms / DAY)
  const hours = Math.floor((ms % DAY) / HOUR)
  const minutes = Math.floor((ms % HOUR) / (60 * 1000))
  const plural = (n: number, word: string) =>
    `${n} ${word}${n === 1 ? '' : 's'}`
  if (days > 0) {
    return hours > 0
      ? `${plural(days, 'day')} ${plural(hours, 'hour')}`
      : plural(days, 'day')
  }
  if (hours > 0) return plural(hours, 'hour')
  return plural(Math.max(1, minutes), 'minute')
}

/** A friendly date and time in the viewer's time zone, e.g. "Fri 12 Jun, 5:00 pm" */
export function formatDeadlineDate(date: Date): string {
  return date.toLocaleString('en-NZ', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function deadlineStatus(
  deadline: string | null | undefined,
  now: Date = new Date()
): DeadlineStatus {
  if (!deadline) return { state: 'none', closesAt: null, label: 'No deadline' }

  const closesAt = new Date(deadline)
  if (Number.isNaN(closesAt.getTime())) {
    return { state: 'none', closesAt: null, label: 'No deadline' }
  }

  const remaining = closesAt.getTime() - now.getTime()
  if (remaining <= 0) {
    return {
      state: 'closed',
      closesAt,
      label: `Closed ${formatDeadlineDate(closesAt)}`,
    }
  }
  if (remaining <= CLOSING_SOON_HOURS * HOUR) {
    return {
      state: 'closing-soon',
      closesAt,
      label: `Closes in ${formatRemaining(remaining)}`,
    }
  }
  return {
    state: 'open',
    closesAt,
    label: `Closes ${formatDeadlineDate(closesAt)}`,
  }
}

export function isPastDeadline(
  deadline: string | null | undefined,
  now: Date = new Date()
): boolean {
  return deadlineStatus(deadline, now).state === 'closed'
}

const pad = (n: number) => String(n).padStart(2, '0')

/** An ISO timestamp as the value of a datetime-local input (local time) */
export function toDatetimeLocalValue(iso: string | null | undefined): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** The value of a datetime-local input (local time) as an ISO timestamp, or null when empty */
export function fromDatetimeLocalValue(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

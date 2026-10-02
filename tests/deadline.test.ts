import { describe, expect, it } from 'vitest'
import {
  deadlineStatus,
  formatRemaining,
  fromDatetimeLocalValue,
  isPastDeadline,
  toDatetimeLocalValue,
} from '@/lib/deadline'

const now = new Date('2026-06-10T00:00:00Z')

describe('deadlineStatus', () => {
  it('treats a missing or invalid deadline as none', () => {
    expect(deadlineStatus(null, now).state).toBe('none')
    expect(deadlineStatus(undefined, now).state).toBe('none')
    expect(deadlineStatus('', now).state).toBe('none')
    expect(deadlineStatus('not a date', now).state).toBe('none')
  })

  it('is open when the deadline is more than three days away', () => {
    const status = deadlineStatus('2026-06-20T00:00:00Z', now)
    expect(status.state).toBe('open')
    expect(status.label).toMatch(/^Closes /)
  })

  it('warns inside the closing-soon window', () => {
    const status = deadlineStatus('2026-06-12T03:00:00Z', now)
    expect(status.state).toBe('closing-soon')
    expect(status.label).toBe('Closes in 2 days 3 hours')
  })

  it('is closed at and after the deadline', () => {
    expect(deadlineStatus('2026-06-10T00:00:00Z', now).state).toBe('closed')
    expect(deadlineStatus('2026-06-01T00:00:00Z', now).state).toBe('closed')
    expect(deadlineStatus('2026-06-01T00:00:00Z', now).label).toMatch(
      /^Closed /
    )
  })

  it('exposes a simple past-deadline check', () => {
    expect(isPastDeadline('2026-06-09T23:59:59Z', now)).toBe(true)
    expect(isPastDeadline('2026-06-10T00:00:01Z', now)).toBe(false)
    expect(isPastDeadline(null, now)).toBe(false)
  })
})

describe('formatRemaining', () => {
  it('uses the largest sensible units', () => {
    expect(formatRemaining(2 * 24 * 3600e3)).toBe('2 days')
    expect(formatRemaining(24 * 3600e3 + 3600e3)).toBe('1 day 1 hour')
    expect(formatRemaining(5 * 3600e3)).toBe('5 hours')
    expect(formatRemaining(12 * 60e3)).toBe('12 minutes')
    expect(formatRemaining(5e3)).toBe('1 minute')
    expect(formatRemaining(-1)).toBe('0 minutes')
  })
})

describe('datetime-local conversion', () => {
  it('round-trips through the local time zone', () => {
    const iso = '2026-06-12T05:00:00.000Z'
    expect(fromDatetimeLocalValue(toDatetimeLocalValue(iso))).toBe(iso)
  })

  it('maps empty values to null and empty text', () => {
    expect(toDatetimeLocalValue(null)).toBe('')
    expect(toDatetimeLocalValue('garbage')).toBe('')
    expect(fromDatetimeLocalValue('')).toBeNull()
    expect(fromDatetimeLocalValue('garbage')).toBeNull()
  })
})

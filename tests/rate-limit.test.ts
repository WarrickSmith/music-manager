import { describe, expect, it } from 'vitest'
import {
  clientIp,
  createRateLimiter,
  describeWait,
} from '@/lib/security/rate-limit'

function limiter(limit = 3, windowMs = 60_000) {
  let time = 1_000_000
  const l = createRateLimiter({ limit, windowMs, now: () => time })
  return { l, advance: (ms: number) => (time += ms) }
}

describe('createRateLimiter', () => {
  it('allows attempts up to the limit, then blocks', () => {
    const { l } = limiter(3)
    expect(l.hit('a').blocked).toBe(false)
    expect(l.hit('a').blocked).toBe(false)
    expect(l.hit('a').blocked).toBe(true)
    expect(l.status('a').blocked).toBe(true)
  })

  it('checking the status does not use up an attempt', () => {
    const { l } = limiter(2)
    for (let i = 0; i < 10; i++) expect(l.status('a').blocked).toBe(false)
    l.hit('a')
    expect(l.status('a').blocked).toBe(false)
  })

  it('counts each key separately', () => {
    const { l } = limiter(1)
    l.hit('a')
    expect(l.status('a').blocked).toBe(true)
    expect(l.status('b').blocked).toBe(false)
  })

  it('says how long to wait and frees the key when the window passes', () => {
    const { l, advance } = limiter(2, 60_000)
    l.hit('a')
    advance(10_000)
    l.hit('a')
    const blocked = l.status('a')
    expect(blocked.blocked).toBe(true)
    // The oldest attempt leaves the window 50 seconds from now
    expect(blocked.retryAfterSeconds).toBe(50)
    advance(50_001)
    expect(l.status('a')).toEqual({ blocked: false, retryAfterSeconds: 0 })
  })

  it('forgets a key on reset', () => {
    const { l } = limiter(1)
    l.hit('a')
    expect(l.status('a').blocked).toBe(true)
    l.reset('a')
    expect(l.status('a').blocked).toBe(false)
  })

  it('does not grow without bound under a key-spraying attack', () => {
    const { l } = limiter(5)
    for (let i = 0; i < 12_000; i++) l.hit(`k${i}`)
    // The oldest keys were dropped to make room, so they start fresh
    expect(l.status('k0').blocked).toBe(false)
    expect(l.status('k11999').blocked).toBe(false)
  })
})

describe('describeWait', () => {
  it('uses seconds or minutes', () => {
    expect(describeWait(1)).toBe('1 second')
    expect(describeWait(45)).toBe('45 seconds')
    expect(describeWait(61)).toBe('2 minutes')
    expect(describeWait(600)).toBe('10 minutes')
  })
})

describe('clientIp', () => {
  const headers = (h: Record<string, string>) => ({
    get: (name: string) => h[name] ?? null,
  })
  it('uses the first forwarded address', () => {
    expect(clientIp(headers({ 'x-forwarded-for': '1.2.3.4, 10.0.0.1' }))).toBe(
      '1.2.3.4'
    )
  })
  it('falls back to x-real-ip, then unknown', () => {
    expect(clientIp(headers({ 'x-real-ip': '5.6.7.8' }))).toBe('5.6.7.8')
    expect(clientIp(headers({}))).toBe('unknown')
  })
})

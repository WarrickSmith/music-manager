/**
 * A small in-memory sliding-window rate limiter for sign-in, registration and
 * password changes.
 *
 * It lives in the server process, so the counts reset when the app restarts
 * and are not shared between several app instances. That is enough to stop
 * password guessing against a single instance, which is how this app is
 * deployed. Appwrite also applies its own limits to session creation.
 */

export interface RateLimitStatus {
  blocked: boolean
  /** Seconds until another attempt is allowed; 0 when not blocked */
  retryAfterSeconds: number
}

export interface RateLimiter {
  /** Whether this key is over its limit, without counting an attempt */
  status(key: string): RateLimitStatus
  /** Count an attempt and report whether the key is now over its limit */
  hit(key: string): RateLimitStatus
  /** Forget a key, e.g. after a successful sign-in */
  reset(key: string): void
}

const MAX_KEYS = 10_000

export function createRateLimiter({
  limit,
  windowMs,
  now = () => Date.now(),
}: {
  /** Attempts allowed per window */
  limit: number
  windowMs: number
  now?: () => number
}): RateLimiter {
  const hits = new Map<string, number[]>()

  const recent = (key: string): number[] => {
    const cutoff = now() - windowMs
    const times = (hits.get(key) ?? []).filter((time) => time > cutoff)
    if (times.length > 0) hits.set(key, times)
    else hits.delete(key)
    return times
  }

  const statusOf = (times: number[]): RateLimitStatus => {
    if (times.length < limit) return { blocked: false, retryAfterSeconds: 0 }
    const retryAt = times[times.length - limit] + windowMs
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((retryAt - now()) / 1000)),
    }
  }

  return {
    status: (key) => statusOf(recent(key)),
    hit(key) {
      const times = recent(key)
      times.push(now())
      // Bound memory if someone sprays many different keys
      if (!hits.has(key) && hits.size >= MAX_KEYS) {
        const oldest = hits.keys().next().value
        if (oldest !== undefined) hits.delete(oldest)
      }
      hits.set(key, times)
      return statusOf(times)
    },
    reset: (key) => {
      hits.delete(key)
    },
  }
}

/** "3 minutes", "45 seconds" for messages */
export function describeWait(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? '' : 's'}`
  const minutes = Math.ceil(seconds / 60)
  return `${minutes} minute${minutes === 1 ? '' : 's'}`
}

const MINUTE = 60_000

/**
 * Shared limiters. Stored on globalThis so a development hot reload does not
 * reset the counts.
 */
function limiters() {
  const g = globalThis as unknown as {
    __mmLimiters?: Record<string, RateLimiter>
  }
  g.__mmLimiters ??= {
    loginIp: createRateLimiter({ limit: 20, windowMs: 15 * MINUTE }),
    loginEmail: createRateLimiter({ limit: 5, windowMs: 15 * MINUTE }),
    register: createRateLimiter({ limit: 10, windowMs: 60 * MINUTE }),
    password: createRateLimiter({ limit: 5, windowMs: 15 * MINUTE }),
  }
  return g.__mmLimiters
}

export const loginIpLimiter = () => limiters().loginIp
export const loginEmailLimiter = () => limiters().loginEmail
export const registerLimiter = () => limiters().register
export const passwordLimiter = () => limiters().password

/** The caller's address from the proxy headers, or "unknown" */
export function clientIp(headers: {
  get(name: string): string | null
}): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown'
}

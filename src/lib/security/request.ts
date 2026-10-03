/**
 * Checks for routes that change data using the browser's cookie. Server
 * actions get a similar check from Next.js; route handlers do not, so they
 * call this.
 *
 * A browser sends Origin (and Sec-Fetch-Site) on cross-site requests, so a
 * page on another site cannot make a signed-in user's browser post here.
 */
export function isSameOrigin(request: Request): boolean {
  const site = request.headers.get('sec-fetch-site')
  if (site && site !== 'same-origin' && site !== 'none') return false

  const origin = request.headers.get('origin')
  if (!origin) return true // Not a browser page request; no cookie-based attack
  const host =
    request.headers.get('x-forwarded-host') ?? request.headers.get('host')
  try {
    return !!host && new URL(origin).host === host.split(',')[0].trim()
  } catch {
    return false
  }
}

/** A short code to quote when reporting an unexpected error; also written to the server log */
export function errorReference(): string {
  return crypto.randomUUID().slice(0, 8)
}

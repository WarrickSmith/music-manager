import { NextResponse, NextRequest } from 'next/server'

/**
 * Adds caching headers to static images.
 *
 * This used to copy the session cookie onto every response, which silently
 * replaced it with a copy that lost its HttpOnly, Secure and SameSite flags.
 * The cookie is set once, with the right flags, when the user signs in, and
 * must be left alone here.
 */
export async function proxy(request: NextRequest) {
  const response = NextResponse.next()
  if (request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
    response.headers.set('Cache-Control', 'public, max-age=86400, immutable')
  }
  return response
}

export const config = {
  matcher: [
    // Match all paths except those starting with /api/, /_next/, /public/
    '/((?!api|_next/static|_next/image|public/|favicon.ico).*)',
    // Match all image files
    '/(.*\\.(?:png|jpg|jpeg|gif|svg|ico)$)',
  ],
}

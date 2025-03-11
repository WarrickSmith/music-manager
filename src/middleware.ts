import { NextResponse, NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Add cache control headers for static image files
  if (request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'public, max-age=86400, immutable')
    return response
  }

  // Your existing middleware logic
  const response = NextResponse.next()

  try {
    // Check for Appwrite session cookie (mm-session)
    const authCookieName = 'mm-session'
    const authCookie = request.cookies.get(authCookieName)

    // If there's an auth cookie, pass it along to the response
    if (authCookie) {
      // Spread the cookie properties first, then override specific ones if needed
      const cookieOptions = {
        path: '/',
        ...authCookie,
      }

      response.cookies.set(authCookieName, authCookie.value, cookieOptions)
    }
  } catch (error) {
    console.error('Middleware auth error:', error)
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

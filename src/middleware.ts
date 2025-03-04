import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const sessionCookie = request.cookies.get('mm-session')

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/login', '/register']
  if (publicRoutes.includes(pathname)) {
    // Allow access to public routes without redirection
    // This prevents redirect loops when a session cookie exists but is invalid
    return NextResponse.next()
  }

  // Protected routes that require authentication
  if (!sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // For role-based routing, we'll handle this in the layout components
  // since we can't reliably check roles in middleware without making API calls

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/|images/|fonts/).*)',
  ],
}

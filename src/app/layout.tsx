import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import Navbar from '@/components/layout/navbar'
import { getCurrentUser } from '@/lib/auth/auth-service'
import { resolveThemePreference, THEME_COOKIE_NAME } from '@/lib/theme'

// Force dynamic rendering for all routes
export const dynamic = 'force-dynamic'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Music Manager',
  description: 'Application for Ice Skaters to manage music files',
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const initialTheme = resolveThemePreference(
    cookieStore.get(THEME_COOKIE_NAME)?.value
  )
  const user = await getCurrentUser()

  return (
    <html
      lang="en"
      className={`h-full overflow-x-hidden ${initialTheme === 'dark' ? 'dark' : ''}`}
      style={{ colorScheme: initialTheme }}
    >
      <body
        suppressHydrationWarning
        className={`${geistSans.variable} ${geistMono.variable} bg-background text-foreground antialiased h-full overflow-x-hidden transition-colors duration-300`}
      >
        <div className="flex flex-col h-full">
          <Navbar initialTheme={initialTheme} user={user} />
          <main className="flex-grow">{children}</main>
          <Toaster
            position="bottom-right"
            closeButton
            richColors
            className="toast-container"
            toastOptions={{
              className:
                'toast-base border border-border/70 bg-card/95 text-card-foreground shadow-lg backdrop-blur-md',
              duration: 4000,
            }}
          />
        </div>
      </body>
    </html>
  )
}

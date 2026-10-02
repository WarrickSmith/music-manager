import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { Bricolage_Grotesque, Instrument_Sans, DM_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import Navbar from '@/components/layout/navbar'
import { getCurrentUser } from '@/lib/auth/auth-service'
import { resolveThemePreference, THEME_COOKIE_NAME } from '@/lib/theme'

// Force dynamic rendering for all routes
export const dynamic = 'force-dynamic'

const headingFont = Bricolage_Grotesque({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['500', '700', '800'],
})

const bodyFont = Instrument_Sans({
  variable: '--font-body',
  subsets: ['latin'],
})

const dataFont = DM_Mono({
  variable: '--font-data',
  subsets: ['latin'],
  weight: ['400', '500'],
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
  // The role picks the accent colour: sky for competitors (and signed-out
  // visitors), rose for admins. See html[data-role] in globals.css.
  const role = user?.labels?.includes('admin') ? 'admin' : 'competitor'

  return (
    <html
      lang="en"
      data-role={role}
      className={`h-full overflow-x-hidden ${initialTheme === 'dark' ? 'dark' : ''}`}
      style={{ colorScheme: initialTheme }}
    >
      <body
        suppressHydrationWarning
        className={`${headingFont.variable} ${bodyFont.variable} ${dataFont.variable} bg-background text-foreground antialiased h-full overflow-x-hidden`}
      >
        <div className="flex flex-col h-full">
          <Navbar initialTheme={initialTheme} user={user} />
          <main className="flex-grow">{children}</main>
          <Toaster
            theme={initialTheme}
            position="bottom-right"
            closeButton
            className="toast-container"
            toastOptions={{
              className:
                'toast-base border border-border bg-card text-card-foreground shadow-lg',
              duration: 4000,
            }}
          />
        </div>
      </body>
    </html>
  )
}

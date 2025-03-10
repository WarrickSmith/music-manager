import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import Navbar from '@/components/layout/navbar'
import { getCurrentUser } from '@/lib/auth/auth-service'

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
  const user = await getCurrentUser()

  return (
    <html lang="en" className="h-full overflow-x-hidden">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full overflow-x-hidden`}
      >
        <div className="flex flex-col h-full">
          <Navbar user={user} />
          <main className="flex-grow">{children}</main>
          <Toaster
            position="bottom-right"
            closeButton
            richColors
            className="toast-container"
            toastOptions={{
              className: 'toast-base shadow-md border',
              duration: 4000,
            }}
          />
        </div>
      </body>
    </html>
  )
}

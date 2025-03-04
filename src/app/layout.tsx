import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Toaster } from 'sonner'
import './globals.css'
import Navbar from '@/components/layout/navbar'
import { getCurrentUser } from '@/lib/auth/auth-service'

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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Navbar user={user} />
        <main className="min-h-screen">{children}</main>
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
      </body>
    </html>
  )
}

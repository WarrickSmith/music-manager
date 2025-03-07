'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { FaMusic, FaUpload, FaHeadphones } from 'react-icons/fa'
import { useEffect, useState } from 'react'
import { logoutAction } from '@/app/actions/auth-actions'
import LoadingOverlay from '@/components/ui/loading-overlay'

export default function Home() {
  const [initializing, setInitializing] = useState(true)

  // Clear any existing session when the home page loads
  useEffect(() => {
    const clearExistingSession = async () => {
      try {
        await logoutAction()
        // No toast notification needed for landing page session cleanup
      } catch (error) {
        console.error('Session cleanup error:', error)
      } finally {
        setInitializing(false)
      }
    }

    clearExistingSession()
  }, [])

  if (initializing) {
    return <LoadingOverlay message="Loading..." />
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-background/95">
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6 animate-fade-in">
          <Image
            src="/mm-logo.png"
            alt="Music Manager Logo"
            width={64}
            height={64}
            priority
            className="rounded-lg shadow-md"
          />
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Music Manager
          </h1>
        </div>

        <p className="text-xl text-center mb-10 max-w-2xl text-muted-foreground leading-relaxed">
          A modern platform for Ice Skaters to upload, organize, and manage
          music files for competitions with ease
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12 w-full max-w-3xl">
          <div className="flex flex-col items-center p-6 rounded-xl bg-card shadow-sm border border-border/40 hover:shadow-md transition-shadow">
            <FaUpload className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Easy Uploads</h3>
            <p className="text-sm text-muted-foreground text-center">
              Upload and store your music files securely
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-xl bg-card shadow-sm border border-border/40 hover:shadow-md transition-shadow">
            <FaMusic className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Organize</h3>
            <p className="text-sm text-muted-foreground text-center">
              Categorize and manage your music collection
            </p>
          </div>

          <div className="flex flex-col items-center p-6 rounded-xl bg-card shadow-sm border border-border/40 hover:shadow-md transition-shadow">
            <FaHeadphones className="w-8 h-8 text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Preview</h3>
            <p className="text-sm text-muted-foreground text-center">
              Listen to your tracks before competitions
            </p>
          </div>
        </div>

        <div className="flex gap-5">
          <Button
            asChild
            size="lg"
            className="rounded-full px-8 shadow-md hover:shadow-lg transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
          >
            <Link href="/login" className="flex items-center gap-2">
              <span>Login</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="rounded-full px-8 border-2 border-purple-400 hover:bg-purple-50 hover:border-purple-500 text-purple-700 font-medium transition-all"
          >
            <Link href="/register" className="flex items-center gap-2">
              <span>Register</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}

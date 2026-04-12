'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Music, Upload, Headphones } from 'lucide-react'
import { useEffect, useState } from 'react'
import { logoutAction } from '@/app/actions/auth-actions'
import LoadingOverlay from '@/components/ui/loading-overlay'

// Import logo at the component level for stability
import logoSrc from '../../public/mm-logo.png'

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
    <main className="flex min-h-[calc(100vh-5rem)] flex-col items-center justify-center px-6 py-12">
      <div className="app-panel relative mx-auto flex w-full max-w-5xl flex-col items-center overflow-hidden px-8 py-14 text-center sm:px-12">
        <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_60%)] dark:bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.22),transparent_58%)]" />
        <div className="relative flex min-h-[10px] items-center gap-4 mb-6 animate-fade-in">
          <Image
            src={logoSrc}
            alt="Music Manager Logo"
            width={64}
            height={64}
            priority
            className="rounded-2xl shadow-lg shadow-slate-950/10"
          />
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text pb-1 text-5xl font-bold leading-[1.2] text-transparent dark:from-sky-300 dark:to-violet-300">
            Music Manager
          </h1>
        </div>

        <p className="relative mb-10 max-w-2xl text-center text-xl leading-relaxed text-muted-foreground">
          A modern platform for Ice Skaters to upload, organize, and manage
          music files for competitions with ease
        </p>

        <div className="relative mb-12 grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-6 shadow-lg shadow-slate-950/5 transition-transform transition-shadow hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <Upload className="mb-4 h-8 w-8 text-sky-600 dark:text-sky-300" />
            <h3 className="mb-2 text-lg font-medium">Easy Uploads</h3>
            <p className="text-sm text-muted-foreground text-center">
              Upload and store your music files securely
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-6 shadow-lg shadow-slate-950/5 transition-transform transition-shadow hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <Music className="mb-4 h-8 w-8 text-violet-600 dark:text-violet-300" />
            <h3 className="mb-2 text-lg font-medium">Organize</h3>
            <p className="text-sm text-muted-foreground text-center">
              Categorize and manage your music collection
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200/70 bg-white/75 p-6 shadow-lg shadow-slate-950/5 transition-transform transition-shadow hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5 dark:shadow-black/20">
            <Headphones className="mb-4 h-8 w-8 text-emerald-600 dark:text-emerald-300" />
            <h3 className="mb-2 text-lg font-medium">Preview</h3>
            <p className="text-sm text-muted-foreground text-center">
              Listen to your tracks before competitions
            </p>
          </div>
        </div>

        <div className="relative flex flex-col gap-4 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 font-medium text-white shadow-lg shadow-blue-900/15 transition-all hover:shadow-xl hover:from-blue-500 hover:to-violet-500 dark:from-sky-500 dark:to-indigo-500 dark:hover:from-sky-400 dark:hover:to-violet-400"
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
            className="rounded-full border-2 border-violet-300/80 bg-white/70 px-8 font-medium text-violet-700 transition-all hover:border-violet-500 hover:bg-violet-50 dark:border-violet-400/50 dark:bg-white/5 dark:text-violet-200 dark:hover:border-violet-300 dark:hover:bg-violet-500/10"
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

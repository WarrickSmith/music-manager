'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Music, Upload, Headphones, ChevronRight, Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { logoutAction } from '@/app/actions/auth-actions'
import LoadingOverlay from '@/components/ui/loading-overlay'
import Logo from '@/components/ui/logo'

const features = [
  {
    icon: Upload,
    title: 'Easy uploads',
    text: 'Pick your competition and grade, drop in the file, and follow live progress.',
  },
  {
    icon: Music,
    title: 'Organised by grade',
    text: 'Every programme is filed by competition, grade and segment.',
  },
  {
    icon: Headphones,
    title: 'Preview anywhere',
    text: 'Play your tracks back before competition day.',
  },
]

export default function Home() {
  const [initializing, setInitializing] = useState(true)

  // Clear any existing session when the home page loads
  useEffect(() => {
    const clearExistingSession = async () => {
      try {
        await logoutAction()
        // No toast needed for landing page session cleanup
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
    <div className="mx-auto w-full max-w-[1400px] px-4 py-8 sm:px-6">
      <main className="overflow-hidden rounded-lg border bg-card">
        <section className="relative grid items-center gap-8 border-b px-6 py-14 sm:px-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* Faint skating tracks: two loops of a figure eight and long edges */}
          <svg
            className="pointer-events-none absolute inset-0 h-full w-full"
            viewBox="0 0 800 400"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <g
              fill="none"
              stroke="var(--border)"
              strokeWidth="1.5"
              opacity=".8"
            >
              <path d="M420 200c0-70 80-110 150-80s90 110 20 140-170-30-170-60z" />
              <path
                d="M420 200c0 70 80 110 150 80s90-110 20-140-170 30-170 60z"
                transform="translate(40 -6)"
              />
              <path d="M60 330c120-60 260-20 380 20s240 20 380-60" />
              <path
                d="M40 360c140-60 280-20 400 20s240 20 380-60"
                opacity=".6"
              />
            </g>
          </svg>

          <div className="relative">
            <h1 className="font-display mb-4 text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Competition music, <span className="text-primary">sorted</span>{' '}
              before you hit the ice.
            </h1>
            <p className="mb-7 max-w-[46ch] text-lg text-muted-foreground">
              Upload your programme music for each grade, check it plays
              cleanly, and let the club admins collect everything in one place.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/login">
                  Login <ChevronRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/register">
                  Register <Plus />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative hidden justify-center md:flex">
            <Logo className="h-auto w-56 drop-shadow-xl" />
          </div>
        </section>

        <section className="grid gap-px bg-border sm:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div key={title} className="bg-card px-6 py-6 sm:px-8">
              <Icon className="mb-2 size-6 text-primary" />
              <h3 className="mb-1 text-lg font-bold">{title}</h3>
              <p className="text-muted-foreground">{text}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

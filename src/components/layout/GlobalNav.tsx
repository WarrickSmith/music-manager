'use client'

import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useMemo } from 'react'

export function GlobalNav() {
  const { user, logout, setShowLoginForm } = useAuth()
  const router = useRouter()

  const authStatus = useMemo(() => {
    if (!user) return 'logged-out'
    return user.labels?.includes('admin') ? 'logged-in-admin' : 'logged-in'
  }, [user])

  const handleAuthClick = async () => {
    if (user) {
      await logout()
      router.replace('/')
    } else {
      // Show login form and navigate to home
      setShowLoginForm(true)
      router.replace('/')
    }
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/next.svg"
            alt="Music Manager"
            width={24}
            height={24}
            className="h-6 w-6"
          />
          <span className="font-bold">Music Manager</span>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2">
          <div
            className={`w-6 h-6 ${
              authStatus === 'logged-out'
                ? 'text-orange-500'
                : authStatus === 'logged-in'
                ? 'text-emerald-500'
                : 'text-violet-500'
            }`}
            role="img"
            aria-label={`User status: ${authStatus}`}
          >
            {authStatus === 'logged-out' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-full h-full"
              >
                <circle cx={12} cy={8} r={4} fill="currentColor" />
                <path
                  d="M6 20C6 16.13 8.63 13 12 13C15.37 13 18 16.13 18 20"
                  fill="currentColor"
                />
              </svg>
            )}
            {authStatus === 'logged-in' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-full h-full"
              >
                <circle cx={12} cy={8} r={4} fill="currentColor" />
                <path
                  d="M6 20C6 16.13 8.63 13 12 13C15.37 13 18 16.13 18 20"
                  fill="currentColor"
                />
                <circle
                  cx={12}
                  cy={12}
                  r={8}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                />
              </svg>
            )}
            {authStatus === 'logged-in-admin' && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-full h-full"
              >
                <circle cx={12} cy={8} r={4} fill="currentColor" />
                <path
                  d="M6 20C6 16.13 8.63 13 12 13C15.37 13 18 16.13 18 20"
                  fill="currentColor"
                />
                <path
                  d="M7 7L17 7M12 2L12 12"
                  stroke="currentColor"
                  strokeWidth={2}
                />
              </svg>
            )}
          </div>
          <Button
            variant="ghost"
            onClick={handleAuthClick}
            className="text-sm font-medium"
          >
            {user ? 'Logout' : 'Login'}
          </Button>
        </div>
      </div>
    </nav>
  )
}

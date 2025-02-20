'use client'

import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useMemo } from 'react'
import {
  UserIcon,
  UserLoggedInIcon,
  AdminIcon,
  MusicIcon,
} from '@/components/ui/icons'

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
          <MusicIcon className="h-6 w-6" />
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
              <UserIcon className="w-full h-full" />
            )}
            {authStatus === 'logged-in' && (
              <UserLoggedInIcon className="w-full h-full" />
            )}
            {authStatus === 'logged-in-admin' && (
              <AdminIcon className="w-full h-full" />
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

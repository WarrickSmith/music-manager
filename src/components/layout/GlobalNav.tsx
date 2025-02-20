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
    <nav className="sticky top-0 z-50 w-full border-b bg-card shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <MusicIcon className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-lg bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Music Manager
          </span>
        </div>
        <div className="flex flex-1 items-center justify-end gap-4">
          <div
            className={`w-8 h-8 rounded-full p-1.5 ${
              authStatus === 'logged-out'
                ? 'bg-orange-100 text-orange-500'
                : authStatus === 'logged-in'
                ? 'bg-emerald-100 text-emerald-500'
                : 'bg-violet-100 text-violet-500'
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
            onClick={handleAuthClick}
            className={`text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 ${
              user
                ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                : 'bg-primary/10 text-primary hover:bg-primary/20'
            }`}
          >
            {user ? 'Logout' : 'Login'}
          </Button>
        </div>
      </div>
    </nav>
  )
}

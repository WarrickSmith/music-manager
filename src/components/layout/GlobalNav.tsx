'use client'

import { useAuth } from '@/context/AuthContext'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function GlobalNav() {
  const { user, logout, setShowLoginForm } = useAuth()
  const router = useRouter()

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
        <div className="flex flex-1 items-center justify-end">
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

'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

export default function LogoutButton() {
  const router = useRouter()
  const { logout, showSpinner, hideSpinner } = useAuth()

  const handleLogout = async () => {
    showSpinner('Logging out...')
    try {
      await logout()
      router.push('/') // Always redirect to home page after logout
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      hideSpinner()
    }
  }

  return (
    <Button
      variant="outline"
      className="rounded-full fixed top-4 right-4"
      onClick={handleLogout}
    >
      Logout
    </Button>
  )
}

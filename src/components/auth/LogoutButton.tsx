'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { account } from '@/lib/appwrite-config'

export default function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await account.deleteSession('current')
      router.push('/') // Always redirect to home page after logout
    } catch (error) {
      console.error('Logout error:', error)
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

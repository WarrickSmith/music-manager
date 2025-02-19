'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { account } from '@/lib/appwrite-config'
import LogoutButton from '@/components/auth/LogoutButton'

export default function AdminDashboard() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in and has admin role
    const checkAuth = async () => {
      try {
        const user = await account.get()
        if (!user.labels?.includes('admin')) {
          router.push('/')
        }
      } catch (error) {
        // If there's an error (no session), redirect to login
        console.error('Authentication error:', error)
        router.push('/')
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen">
      <LogoutButton />
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <p className="text-gray-600">
          Welcome to the admin dashboard. This page will be expanded in Phase 4
          to include user management, competition management, and other
          administrative features.
        </p>
      </div>
    </div>
  )
}

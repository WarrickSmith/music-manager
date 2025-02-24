'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function CompetitorDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      // If not loading and either no user or not competitor, redirect
      if (!user || !user.labels?.includes('competitor')) {
        router.push('/')
      }
    }
  }, [user, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-t-4 border-t-primary border-gray-200 rounded-full animate-spin" />
        <p className="text-gray-600">Verifying competitor access...</p>
      </div>
    )
  }

  // Only render dashboard if user is competitor
  if (!user?.labels?.includes('competitor')) {
    return null
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto p-8">
        <h1 className="text-3xl font-bold mb-6">Competitor Dashboard</h1>
        <p className="text-gray-600">
          Welcome to your competitor dashboard. This page will be expanded in
          Phase 5 to include music file management, competition viewing, and
          other competitor-specific features.
        </p>
      </div>
    </div>
  )
}

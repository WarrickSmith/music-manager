'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading) {
      // If not loading and either no user or not admin, redirect
      if (!user || !user.labels?.includes('admin')) {
        router.push('/')
      }
    }
  }, [user, loading, router])

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 border-4 border-t-4 border-t-primary border-gray-200 rounded-full animate-spin" />
        <p className="text-gray-600">Verifying administrator access...</p>
      </div>
    )
  }

  // Only render dashboard if user is admin
  if (!user?.labels?.includes('admin')) {
    return null
  }

  return (
    <div className="min-h-screen">
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

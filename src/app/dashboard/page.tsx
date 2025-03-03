'use client'

import { useEffect, useState } from 'react'
import AdminView from '@/components/dashboard/admin-view'
import CompetitorView from '@/components/dashboard/competitor-view'

export default function DashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // This is a placeholder for the authentication check we'll implement in Phase 3
    // For now, just simulate loading and then default to competitor
    const timer = setTimeout(() => {
      setUserRole('competitor')
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    )
  }

  return (
    <div>
      {userRole === 'admin' && <AdminView />}
      {userRole === 'competitor' && <CompetitorView />}
    </div>
  )
}

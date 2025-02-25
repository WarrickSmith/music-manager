'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { UserManagement } from '@/components/admin/UserManagement'
import { CompetitionManagement } from '@/components/admin/CompetitionManagement'

type Tab = 'users' | 'competitions'

export default function AdminDashboard() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>('users')

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
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-8">
        <div className="flex flex-col gap-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">
              Manage users, competitions, and grades
            </p>
          </div>

          {/* Tabs */}
          <div className="border-b">
            <div className="flex gap-4">
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'users'
                    ? 'border-b-2 border-primary font-semibold'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setActiveTab('users')}
              >
                Users
              </button>
              <button
                className={`pb-2 px-1 ${
                  activeTab === 'competitions'
                    ? 'border-b-2 border-primary font-semibold'
                    : 'text-muted-foreground'
                }`}
                onClick={() => setActiveTab('competitions')}
              >
                Competitions
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div>
            {activeTab === 'users' && <UserManagement />}
            {activeTab === 'competitions' && <CompetitionManagement />}
          </div>
        </div>
      </div>
    </div>
  )
}

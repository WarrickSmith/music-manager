'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Login from '@/components/auth/Login'
import Register from '@/components/auth/Register'
import { useAuth } from '@/context/AuthContext'
import { MusicIcon } from '@/components/ui/icons'

export default function Home() {
  const router = useRouter()
  const { user, loading, showLoginForm, setShowLoginForm } = useAuth()

  useEffect(() => {
    if (user) {
      // Redirect to appropriate dashboard based on role
      if (user.labels?.includes('admin')) {
        router.push('/admin')
      } else {
        router.push('/competitor')
      }
    }
  }, [user, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <MusicIcon className="w-10 h-10" />
            <h1 className="text-4xl font-bold">Music Manager</h1>
          </div>
          <p className="text-gray-600">
            Upload and manage music files for your skating competitions
          </p>
        </div>

        {/* Auth Forms */}
        {!user && (
          <div className="mt-8">
            {showLoginForm ? (
              <div>
                <Login />
                <p className="text-center mt-4">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setShowLoginForm(false)}
                    className="text-blue-500 hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <Register onRegistered={() => setShowLoginForm(true)} />
                <p className="text-center mt-4">
                  Already have an account?{' '}
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="text-blue-500 hover:underline"
                  >
                    Login here
                  </button>
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  )
}

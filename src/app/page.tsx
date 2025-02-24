'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Login from '@/components/auth/Login'
import Register from '@/components/auth/Register'
import { useAuth } from '@/context/AuthContext'
import { MusicIcon } from '@/components/ui/icons'
import { RiUserAddLine, RiLoginBoxLine } from 'react-icons/ri'

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin">
            <MusicIcon className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-8 bg-background">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="bg-primary/10 p-4 rounded-2xl">
              <MusicIcon className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Music Manager
            </h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Upload and manage music files for your skating competitions
          </p>
        </div>

        {/* Auth Forms */}
        {!user && (
          <div className="mt-8">
            {showLoginForm ? (
              <div>
                <Login />
                <p className="text-center mt-4 flex items-center justify-center gap-1">
                  Don&apos;t have an account?
                  <button
                    onClick={() => setShowLoginForm(false)}
                    className="text-primary font-medium hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10 inline-flex items-center gap-1.5"
                  >
                    Register here
                    <RiUserAddLine className="w-4 h-4" />
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <Register onRegistered={() => setShowLoginForm(true)} />
                <p className="text-center mt-4 flex items-center justify-center gap-1">
                  Already have an account?
                  <button
                    onClick={() => setShowLoginForm(true)}
                    className="text-primary font-medium hover:text-primary/80 transition-colors px-2 py-1 rounded-lg hover:bg-primary/10 inline-flex items-center gap-1.5"
                  >
                    Login here
                    <RiLoginBoxLine className="w-4 h-4" />
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

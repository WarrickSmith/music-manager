'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Login from '@/components/auth/Login'
import Register from '@/components/auth/Register'
import LogoutButton from '@/components/auth/LogoutButton'
import { Button } from '@/components/ui/button'
import { account } from '@/lib/appwrite-config'

export default function Home() {
  const router = useRouter()
  const [showLogin, setShowLogin] = useState(true)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // By default, assume not logged in
    setIsLoggedIn(false)
    setIsLoading(false)

    // Only attempt to get user data if we have an Appwrite cookie
    const cookies = document.cookie
    if (cookies.includes('a_session_')) {
      const checkSession = async () => {
        try {
          const user = await account.get()
          setIsLoggedIn(true)

          // Redirect to appropriate dashboard based on role
          if (user.labels?.includes('admin')) {
            router.push('/admin')
          } else {
            router.push('/competitor')
          }
        } catch (error) {
          // Invalid or expired session
          console.error('Session check error:', error)
          setIsLoggedIn(false)
        }
      }

      checkSession()
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <main className="min-h-screen p-8">
      {/* Show LogoutButton only when logged in */}
      {isLoggedIn && <LogoutButton />}

      {/* Show Login button when not logged in */}
      {!isLoggedIn && (
        <div className="absolute top-4 right-4">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => setShowLogin(true)}
          >
            Login
          </Button>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Image
              src="/next.svg"
              alt="Music Icon"
              width={40}
              height={40}
              priority
            />
            <h1 className="text-4xl font-bold">Music Manager</h1>
          </div>
          <p className="text-gray-600">
            Upload and manage music files for your skating competitions
          </p>
        </div>

        {/* Auth Forms */}
        {!isLoggedIn && (
          <div className="mt-8">
            {showLogin ? (
              <div>
                <Login />
                <p className="text-center mt-4">
                  Don&apos;t have an account?{' '}
                  <button
                    onClick={() => setShowLogin(false)}
                    className="text-blue-500 hover:underline"
                  >
                    Register here
                  </button>
                </p>
              </div>
            ) : (
              <div>
                <Register onRegistered={() => setShowLogin(true)} />
                <p className="text-center mt-4">
                  Already have an account?{' '}
                  <button
                    onClick={() => setShowLogin(true)}
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

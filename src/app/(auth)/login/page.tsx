'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import Image from 'next/image'
import { loginAction, logoutAction } from '@/app/actions/auth-actions'
import { showToast } from '@/components/ui/toast'
import LoadingOverlay from '@/components/ui/loading-overlay'

// Import logo at the component level for stability
import logoSrc from '../../../../public/mm-logo.png'

export default function LoginPage() {
  const [formState, setFormState] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()

  // Clear any existing session when the login page loads
  useEffect(() => {
    const clearExistingSession = async () => {
      try {
        await logoutAction()
        // No need for a toast notification here since this is just clean-up
      } catch (error) {
        console.error('Session cleanup error:', error)
      } finally {
        setInitializing(false)
      }
    }

    clearExistingSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Create FormData object to match the expected format in loginAction
      const formData = new FormData()
      formData.append('email', formState.email)
      formData.append('password', formState.password)

      const result = await loginAction(formData)

      if (result.success) {
        // Show toast but keep the loading spinner active
        showToast.login('Logged in successfully')

        if (result.redirectTo) {
          // Set redirecting state to true to maintain the loading overlay
          setIsRedirecting(true)
          // Navigate to the dashboard
          router.push(result.redirectTo)
          // We don't set loading to false here, keeping the overlay visible
          // during the navigation
          return
        }
      } else {
        showToast.error(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      showToast.error('An unexpected error occurred')
    }

    // Only set loading to false if we didn't redirect
    // (if there was an error or no redirect path)
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState({ ...formState, [name]: value })
  }

  if (initializing) {
    return <LoadingOverlay message="Preparing login..." />
  }

  return (
    <div className="container max-w-md mx-auto p-6 space-y-8">
      {/* Show loading overlay during both loading and redirecting states */}
      {(loading || isRedirecting) && (
        <LoadingOverlay
          message={
            isRedirecting ? 'Taking you to your dashboard...' : 'Signing in...'
          }
        />
      )}

      <div className="flex flex-col items-center mb-8">
        <div className="flex items-center gap-4 mb-4 animate-fade-in">
          <Image
            src={logoSrc}
            alt="Music Manager Logo"
            width={48}
            height={48}
            priority
            className="rounded-lg shadow-md"
          />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Music Manager
          </h1>
        </div>
        <p className="text-xl font-medium text-blue-600">Welcome Back</p>
        <p className="text-gray-600">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700"
          >
            Email
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="your@email.com"
            value={formState.email}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              Forgot password?
            </a>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="Enter your password"
            value={formState.password}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || isRedirecting}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
        >
          Sign In
        </Button>
      </form>

      <div className="text-center mt-8">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

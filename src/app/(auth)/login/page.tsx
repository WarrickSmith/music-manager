'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { loginAction, logoutAction } from '@/app/actions/auth-actions'
import { showToast } from '@/components/ui/toast'
import LoadingOverlay from '@/components/ui/loading-overlay'

import Logo from '@/components/ui/logo'
import ErrorNotice from '@/components/ui/error-notice'

export default function LoginPage() {
  const [formState, setFormState] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<{ message: string; details?: string } | null>(
    null
  )
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
    setError(null)

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
        setError({ message: result.error || 'Login failed' })
        showToast.error(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError({
        message: 'Something went wrong while signing in. Please try again.',
        details: error instanceof Error ? error.message : String(error),
      })
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
    <div className="container mx-auto max-w-md space-y-8 p-6">
      {/* Show loading overlay during both loading and redirecting states */}
      {(loading || isRedirecting) && (
        <LoadingOverlay
          message={
            isRedirecting ? 'Taking you to your dashboard...' : 'Signing in...'
          }
        />
      )}

      <div className="mb-8 flex flex-col items-center text-center">
        <div className="mb-4 flex items-center gap-3 animate-fade-in">
          <Logo className="h-12 w-12" />
          <h1 className="font-display text-4xl font-extrabold tracking-tight">
            Music Manager
          </h1>
        </div>
        <p className="text-xl font-semibold text-primary">Welcome back</p>
        <p className="text-muted-foreground">Sign in to your account</p>
      </div>

      {error && (
        <ErrorNotice title="Could not sign in" message={error.message} details={error.details} />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="email" className="label-mono block">
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
          <label htmlFor="password" className="label-mono block">
            Password
          </label>
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
          {/* Below the input so tabbing goes email -> password */}
          <div className="flex justify-end">
            <a
              href="#"
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </a>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading || isRedirecting}
          className="w-full"
        >
          Sign In
        </Button>
      </form>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Don&apos;t have an account?{' '}
          <Link
            href="/register"
            className="font-semibold text-primary hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  )
}

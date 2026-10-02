'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerAction, logoutAction } from '@/app/actions/auth-actions'
import { showToast } from '@/components/ui/toast'
import LoadingOverlay from '@/components/ui/loading-overlay'

import Logo from '@/components/ui/logo'
import ErrorNotice from '@/components/ui/error-notice'

export default function RegisterPage() {
  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [error, setError] = useState<{ message: string; details?: string } | null>(
    null
  )
  const router = useRouter()

  // Clear any existing session when the register page loads
  useEffect(() => {
    const clearExistingSession = async () => {
      try {
        await logoutAction()
        // No toast notification needed for clean-up
      } catch (error) {
        console.error('Session cleanup error:', error)
      } finally {
        setInitializing(false)
      }
    }

    clearExistingSession()
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Validate passwords match
    if (formState.password !== formState.confirmPassword) {
      setError({ message: 'Passwords do not match.' })
      showToast.error('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate minimum password length
    if (formState.password.length < 8) {
      setError({ message: 'Password must be at least 8 characters.' })
      showToast.error('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      // Create FormData object to match the expected format in registerAction
      const formData = new FormData()
      formData.append('firstName', formState.firstName)
      formData.append('lastName', formState.lastName)
      formData.append('email', formState.email)
      formData.append('password', formState.password)

      // Submit registration data
      const result = await registerAction(formData)

      if (result.success) {
        showToast.success(result.message || 'Registration successful!')

        if (result.redirectTo) {
          // Set redirecting state to true to maintain the loading overlay
          setIsRedirecting(true)
          // Navigate to the login page
          router.push(result.redirectTo)
          // We don't set loading to false here, keeping the overlay visible
          // during the navigation
          return
        }
      } else {
        setError({ message: result.error || 'Registration failed' })
        showToast.error(result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError({
        message: 'Something went wrong while creating your account. Please try again.',
        details: error instanceof Error ? error.message : String(error),
      })
      showToast.error('An unexpected error occurred')
    }

    // Only set loading to false if we didn't redirect
    setLoading(false)
  }

  if (initializing) {
    return <LoadingOverlay message="Preparing registration..." />
  }

  return (
    <div className="container mx-auto max-w-md space-y-8 p-6">
      {/* Show loading overlay during both loading and redirecting states */}
      {(loading || isRedirecting) && (
        <LoadingOverlay
          message={
            isRedirecting
              ? 'Registration complete...'
              : 'Creating your account...'
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
        <p className="text-xl font-semibold text-primary">Create account</p>
        <p className="text-muted-foreground">Sign up for Music Manager</p>
      </div>

      {error && (
        <ErrorNotice
          title="Could not create your account"
          message={error.message}
          details={error.details}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="label-mono block">
              First Name
            </label>
            <Input
              id="firstName"
              name="firstName"
              type="text"
              required
              placeholder="First name"
              value={formState.firstName}
              onChange={handleChange}
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="label-mono block">
              Last Name
            </label>
            <Input
              id="lastName"
              name="lastName"
              type="text"
              required
              placeholder="Last name"
              value={formState.lastName}
              onChange={handleChange}
              className="w-full"
            />
          </div>
        </div>

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
            autoComplete="new-password"
            required
            placeholder="Create a password (min. 8 characters)"
            value={formState.password}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="label-mono block"
          >
            Confirm Password
          </label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            placeholder="Confirm your password"
            value={formState.confirmPassword}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || isRedirecting}
          className="w-full"
        >
          Create Account
        </Button>
      </form>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

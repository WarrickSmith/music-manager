'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { registerAction, logoutAction } from '@/app/actions/auth-actions'
import { showToast } from '@/components/ui/toast'
import LoadingOverlay from '@/components/ui/loading-overlay'

// Import logo at the component level for stability
import logoSrc from '../../../../public/mm-logo.png'

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

    // Validate passwords match
    if (formState.password !== formState.confirmPassword) {
      showToast.error('Passwords do not match')
      setLoading(false)
      return
    }

    // Validate minimum password length
    if (formState.password.length < 8) {
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
        showToast.error(result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
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

      <div className="flex flex-col items-center mb-8">
        <div className="mb-4 flex min-h-[90px] items-center gap-4 animate-fade-in">
          <Image
            src={logoSrc}
            alt="Music Manager Logo"
            width={48}
            height={48}
            priority
            className="rounded-2xl shadow-lg shadow-slate-950/10"
          />
          <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text pb-1 text-4xl font-bold leading-[1.2] text-transparent dark:from-sky-300 dark:to-violet-300">
            Music Manager
          </h1>
        </div>
        <p className="text-xl font-medium text-blue-600 dark:text-sky-300">
          Create Account
        </p>
        <p className="text-muted-foreground">Sign up for Music Manager</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="firstName" className="block text-sm font-medium">
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
              className="w-full bg-background/70"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="lastName" className="block text-sm font-medium">
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
              className="w-full bg-background/70"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
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
            className="w-full bg-background/70"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium">
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
            className="w-full bg-background/70"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium"
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
            className="w-full bg-background/70"
          />
        </div>

        <Button
          type="submit"
          disabled={loading || isRedirecting}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 font-medium text-white hover:from-blue-500 hover:to-violet-500 dark:from-sky-500 dark:to-indigo-500 dark:hover:from-sky-400 dark:hover:to-violet-400"
        >
          Create Account
        </Button>
      </form>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline dark:text-sky-300"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

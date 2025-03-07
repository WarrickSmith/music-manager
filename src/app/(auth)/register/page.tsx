'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { registerAction, logoutAction } from '@/app/actions/auth-actions'
import { showToast } from '@/components/ui/toast'
import LoadingOverlay from '@/components/ui/loading-overlay'

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
  const router = useRouter()

  // Clear any existing session when the register page loads
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
          router.push(result.redirectTo)
        }
      } else {
        showToast.error(result.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      showToast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (initializing) {
    return <LoadingOverlay message="Preparing registration..." />
  }

  return (
    <div className="container max-w-md mx-auto p-6 space-y-8">
      {loading && <LoadingOverlay message="Creating your account..." />}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">
          Create Account
        </h1>
        <p className="text-gray-600">Sign up for Music Manager</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="block text-sm font-medium text-gray-700"
            >
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
            <label
              htmlFor="lastName"
              className="block text-sm font-medium text-gray-700"
            >
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
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
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
            className="block text-sm font-medium text-gray-700"
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
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
        >
          Create Account
        </Button>
      </form>

      <div className="text-center mt-8">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

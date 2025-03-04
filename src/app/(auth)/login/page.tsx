'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { loginAction } from '@/app/actions/auth-actions'
import { showToast } from '@/components/ui/toast'
import LoadingOverlay from '@/components/ui/loading-overlay'

export default function LoginPage() {
  const [formState, setFormState] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

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
        showToast.login('Logged in successfully')
        if (result.redirectTo) {
          router.push(result.redirectTo)
        }
      } else {
        showToast.error(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      showToast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormState({ ...formState, [name]: value })
  }

  return (
    <div className="container max-w-md mx-auto p-6 space-y-8">
      {loading && <LoadingOverlay message="Signing in..." />}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2">Welcome Back</h1>
        <p className="text-gray-600">Sign in to your Music Manager account</p>
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
          disabled={loading}
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

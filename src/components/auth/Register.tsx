'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/context/AuthContext'

interface RegisterProps {
  onRegistered: () => void
}

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
}

export default function Register({ onRegistered }: RegisterProps) {
  const { showSpinner, hideSpinner } = useAuth()
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    showSpinner('Creating your account...')

    try {
      // Validate passwords match
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match')
        return
      }

      // Validate password length
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long')
        return
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          name: `${formData.firstName} ${formData.lastName}`.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Registration failed')
      }

      await response.json()

      // Call the callback to switch to login form
      onRegistered()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to register. Please try again.'
      )
      console.error(err)
    } finally {
      setIsLoading(false)
      hideSpinner()
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 space-y-8 bg-card rounded-2xl shadow-lg border border-border/50">
      <h2 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
        Register
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2 group">
          <Label
            htmlFor="firstName"
            className="text-sm font-medium transition-transform duration-200 group-focus-within:translate-x-1 !bg-gradient-to-r !from-green-500 !via-emerald-500 !to-teal-500"
          >
            First Name
          </Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            className="w-full px-4 py-2 rounded-lg border border-input focus:ring-2 focus:ring-primary/20"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2 group">
          <Label
            htmlFor="lastName"
            className="text-sm font-medium transition-transform duration-200 group-focus-within:translate-x-1 !bg-gradient-to-r !from-teal-500 !via-emerald-500 !to-green-500"
          >
            Last Name
          </Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            className="w-full px-4 py-2 rounded-lg border border-input focus:ring-2 focus:ring-primary/20"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2 group">
          <Label
            htmlFor="email"
            className="text-sm font-medium transition-transform duration-200 group-focus-within:translate-x-1 !bg-gradient-to-r !from-blue-500 !via-primary !to-violet-500"
          >
            Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            className="w-full px-4 py-2 rounded-lg border border-input focus:ring-2 focus:ring-primary/20"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2 group">
          <Label
            htmlFor="password"
            className="text-sm font-medium transition-transform duration-200 group-focus-within:translate-x-1 !bg-gradient-to-r !from-violet-500 !via-purple-500 !to-fuchsia-500"
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password (min. 8 characters)"
            className="w-full px-4 py-2 rounded-lg border border-input focus:ring-2 focus:ring-primary/20"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
            minLength={8}
          />
        </div>

        <div className="space-y-2 group">
          <Label
            htmlFor="confirmPassword"
            className="text-sm font-medium transition-transform duration-200 group-focus-within:translate-x-1 !bg-gradient-to-r !from-fuchsia-500 !via-purple-500 !to-violet-500"
          >
            Confirm Password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="Confirm your password"
            className="w-full px-4 py-2 rounded-lg border border-input focus:ring-2 focus:ring-primary/20"
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData({ ...formData, confirmPassword: e.target.value })
            }
            required
          />
        </div>

        {error && (
          <p className="text-destructive text-sm bg-destructive/10 p-3 rounded-lg">
            {error}
          </p>
        )}

        <Button
          type="submit"
          className="w-full text-base font-medium bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Registering...
            </span>
          ) : (
            'Register'
          )}
        </Button>
      </form>
    </div>
  )
}

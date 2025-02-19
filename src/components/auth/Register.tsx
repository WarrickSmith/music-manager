'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'

interface RegisterProps {
  onRegistered: () => void
}

interface RegisterFormData {
  email: string
  password: string
  firstName: string
  lastName: string
}

export default function Register({ onRegistered }: RegisterProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
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
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center">Register</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            placeholder="Enter your first name"
            value={formData.firstName}
            onChange={(e) =>
              setFormData({ ...formData, firstName: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            placeholder="Enter your last name"
            value={formData.lastName}
            onChange={(e) =>
              setFormData({ ...formData, lastName: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Registering...' : 'Register'}
        </Button>
      </form>
    </div>
  )
}

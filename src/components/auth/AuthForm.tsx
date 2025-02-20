'use client'

import { useState, FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getAccount } from '@/lib/appwrite-config'

interface User {
  $id: string
  name: string
  email: string
}

export default function AuthForm() {
  const [loggedInUser, setLoggedInUser] = useState<User | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const account = getAccount()
      await account.createEmailPasswordSession(email, password)
      const user = await account.get()
      setLoggedInUser(user)
    } catch (err) {
      setError('Failed to login. Please check your credentials.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (e: FormEvent) => {
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
          email,
          password,
          name,
        }),
      })

      if (!response.ok) {
        throw new Error('Registration failed')
      }

      const data = await response.json()
      setLoggedInUser(data.user)
    } catch (err) {
      setError('Failed to register. Please try again.')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      const account = getAccount()
      await account.deleteSession('current')
      setLoggedInUser(null)
    } catch (err) {
      console.error(err)
    }
  }

  if (loggedInUser) {
    return (
      <div className="text-center">
        <p className="mb-4">Welcome, {loggedInUser.name}!</p>
        <Button onClick={logout} variant="outline">
          Logout
        </Button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <form onSubmit={login} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading}>
            Login
          </Button>
          <Button
            type="button"
            onClick={register}
            variant="outline"
            disabled={isLoading}
          >
            Register
          </Button>
        </div>
      </form>
    </div>
  )
}

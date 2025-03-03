'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // Login functionality will be implemented in Phase 3
    console.log('Login attempt with:', { email, password })
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-center mt-8">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/mm-logo.png"
            alt="Music Manager Logo"
            width={48}
            height={48}
          />
          <h1 className="text-3xl font-bold">Music Manager</h1>
        </Link>
      </div>

      <div className="bg-card rounded-lg shadow-md p-6 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4 text-center">Login</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full">
            Login
          </Button>
        </form>

        <div className="text-center text-sm mt-4">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}

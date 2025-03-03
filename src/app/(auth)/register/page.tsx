'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setPasswordError('')

    // Registration functionality will be implemented in Phase 3
    console.log('Register attempt with:', {
      firstName,
      lastName,
      email,
      password,
    })
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
        <h2 className="text-xl font-semibold mb-4 text-center">Register</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="firstName" className="text-sm font-medium">
                First Name
              </label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="lastName" className="text-sm font-medium">
                Last Name
              </label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

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

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            {passwordError && (
              <p className="text-sm text-red-500">{passwordError}</p>
            )}
          </div>

          <Button type="submit" className="w-full">
            Register
          </Button>
        </form>

        <div className="text-center text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}

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
    <div className="flex flex-col items-center justify-center py-10 px-4 bg-gradient-to-b from-purple-500/10 to-blue-500/10 min-h-screen w-full absolute inset-0">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10 animate-fade-in">
          <Link
            href="/"
            className="flex items-center gap-3 transition-transform hover:scale-105"
          >
            <Image
              src="/mm-logo.png"
              alt="Music Manager Logo"
              width={56}
              height={56}
              className="rounded-lg shadow-sm"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Music Manager
            </h1>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-purple-100 p-8 transition-all hover:shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Create Account
          </h2>
          <form onSubmit={handleRegister} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label
                  htmlFor="firstName"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-purple-500"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>First Name</span>
                </label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="rounded-md border-purple-200 focus-visible:ring-purple-400 transition-all bg-white/90"
                  placeholder="John"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="lastName"
                  className="text-sm font-medium text-gray-700 flex items-center gap-2"
                >
                  <span>Last Name</span>
                </label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="rounded-md border-purple-200 focus-visible:ring-purple-400 transition-all bg-white/90"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-500"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>Email</span>
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="rounded-md border-purple-200 focus-visible:ring-purple-400 transition-all bg-white/90"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-500"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Password</span>
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="rounded-md border-purple-200 focus-visible:ring-purple-400 transition-all bg-white/90"
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-gray-700 flex items-center gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-purple-500"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                </svg>
                <span>Confirm Password</span>
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="rounded-md border-purple-200 focus-visible:ring-purple-400 transition-all bg-white/90"
                placeholder="••••••••"
              />
              {passwordError && (
                <p className="text-sm text-red-500 mt-1 bg-red-50 p-2 rounded-md border border-red-100">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                className="w-full rounded-md shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-medium py-5"
              >
                Register
              </Button>
            </div>
          </form>

          <div className="text-center mt-6 bg-purple-50 p-4 rounded-lg border border-purple-100">
            <p className="text-gray-600 mb-2">Already have an account?</p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium hover:bg-blue-200 transition-colors text-sm"
            >
              <span>Login Now</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="ml-1"
              >
                <path d="m9 18 6-6-6-6" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

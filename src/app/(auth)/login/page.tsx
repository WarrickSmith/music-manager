'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/app/actions/auth-actions'
import LoadingOverlay from '@/components/ui/loading-overlay'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (formData: FormData) => {
    setIsLoading(true)

    try {
      const result = await loginAction(formData)

      if (result.success) {
        toast.success('Logged in successfully')
        if (result.redirectTo) {
          router.push(result.redirectTo)
        }
      } else {
        toast.error(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('Login error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-10 px-4 bg-gradient-to-b from-blue-500/10 to-purple-500/10 min-h-screen w-full absolute inset-0">
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
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Music Manager
            </h1>
          </Link>
        </div>

        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-blue-100 p-8 transition-all hover:shadow-xl">
          <h2 className="text-2xl font-semibold mb-6 text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Welcome Back!
          </h2>

          {isLoading && <LoadingOverlay message="Logging in..." />}

          <form action={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium flex items-center gap-2 text-gray-700"
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
                  className="text-blue-500"
                >
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>Email</span>
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                className="rounded-md border-blue-200 focus-visible:ring-blue-400 transition-all bg-white/90"
                placeholder="your.email@example.com"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium flex items-center gap-2 text-gray-700"
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
                  className="text-blue-500"
                >
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Password</span>
              </label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                className="rounded-md border-blue-200 focus-visible:ring-blue-400 transition-all bg-white/90"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full rounded-md shadow-sm hover:shadow-md transition-all bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-5"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>

          <div className="text-center mt-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="text-gray-600 mb-2">Don&apos;t have an account?</p>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium hover:bg-purple-200 transition-colors text-sm"
            >
              <span>Register Now</span>
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
                <path d="M12 5v14M5 12h14" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

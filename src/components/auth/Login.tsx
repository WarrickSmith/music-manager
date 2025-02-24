'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { getAccount } from '@/lib/appwrite-config'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

interface LoginFormData {
  email: string
  password: string
}

export default function Login() {
  const router = useRouter()
  const { checkAuth } = useAuth()
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const account = getAccount()

      // First, check if there's an active session
      try {
        const currentUser = await account.get()

        // If the current user's email matches login attempt
        if (currentUser.email === formData.email) {
          toast.info('You are already logged in with this account', {
            className: 'bg-blue-500 text-white rounded-lg shadow-lg p-4',
            duration: 3000,
          })

          // Update auth context and redirect
          await checkAuth()
          if (currentUser.labels && currentUser.labels.includes('admin')) {
            router.push('/admin')
          } else {
            router.push('/competitor')
          }
          return
        }

        // Different user trying to log in, delete current session
        await account.deleteSession('current')
        toast.info('Logging in as different user...', {
          className: 'bg-blue-500 text-white rounded-lg shadow-lg p-4',
          duration: 3000,
        })
      } catch {
        // No active session, proceed with login
      }

      // Create new session
      await account.createEmailPasswordSession(
        formData.email,
        formData.password
      )

      // Update auth context
      await checkAuth()

      // Get fresh user data to check role
      const user = await account.get()

      // Check user's role and redirect accordingly
      if (user.labels && user.labels.includes('admin')) {
        router.push('/admin')
      } else {
        router.push('/competitor')
      }
    } catch (err) {
      toast.error('Failed to login. Please check your credentials.', {
        className: 'bg-red-500 text-white rounded-lg shadow-lg p-4',
        duration: 3000,
      })
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto p-8 space-y-8 bg-card rounded-2xl shadow-lg border border-border/50">
      <h2 className="text-3xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
        Login
      </h2>
      <form onSubmit={handleSubmit} className="space-y-6">
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
            className="text-sm font-medium transition-transform duration-200 group-focus-within:translate-x-1 !bg-gradient-to-r !from-violet-500 !via-primary !to-blue-500"
          >
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="w-full px-4 py-2 rounded-lg border border-input focus:ring-2 focus:ring-primary/20"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            required
          />
        </div>

        <Button
          type="submit"
          className="w-full text-base font-medium bg-primary hover:bg-primary/90 text-white rounded-lg py-2.5"
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Logging in...
            </span>
          ) : (
            'Login'
          )}
        </Button>
      </form>
    </div>
  )
}

'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react'
import { getAccount } from '@/lib/appwrite-config'
import { Models } from 'appwrite'
import { toast } from 'sonner'
import Spinner from '@/components/ui/Spinner'

interface AuthContextType {
  user: Models.User<Models.Preferences> | null
  loading: boolean
  showLoginForm: boolean
  setShowLoginForm: (show: boolean) => void
  logout: () => Promise<void>
  checkAuth: () => Promise<Models.User<Models.Preferences>>
  showSpinner: (message: string) => void
  hideSpinner: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)
  const [showLoginForm, setShowLoginForm] = useState(true)
  const [spinnerMessage, setSpinnerMessage] = useState<string | null>(null)

  const showSpinner = (message: string) => setSpinnerMessage(message)
  const hideSpinner = () => setSpinnerMessage(null)

  const checkAuth = async () => {
    showSpinner('Checking authentication...')
    try {
      // Only check auth if we have an active session
      const account = getAccount()
      const currentUser = await account.get()
      setUser(currentUser)
      // Show success toast on successful login
      toast.success('Successfully logged in', {
        className: `${
          currentUser.labels?.includes('admin')
            ? 'bg-amber-500'
            : 'bg-emerald-500'
        } text-white rounded-lg shadow-lg p-4`,
        duration: 3000,
      })
      return currentUser
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
      toast.error('Authentication failed', {
        className: 'bg-red-500 text-white rounded-lg shadow-lg p-4',
        duration: 3000,
      })
      throw error // Re-throw to handle in the component
    } finally {
      setLoading(false)
      hideSpinner()
    }
  }

  const logout = async () => {
    showSpinner('Logging out...')
    try {
      const account = getAccount()
      await account.deleteSession('current')
      setUser(null)
      toast.info('Successfully logged out', {
        className: 'bg-blue-500 text-white rounded-lg shadow-lg p-4',
        duration: 3000,
      })
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout', {
        className: 'bg-red-500 text-white rounded-lg shadow-lg p-4',
        duration: 3000,
      })
    } finally {
      hideSpinner()
    }
  }

  useEffect(() => {
    // Don't automatically check auth on mount
    setLoading(false)
  }, [])

  const value = {
    user,
    loading,
    showLoginForm,
    setShowLoginForm,
    logout,
    checkAuth,
    showSpinner,
    hideSpinner,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
      {spinnerMessage && <Spinner message={spinnerMessage} />}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

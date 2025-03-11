'use client'

import Link from 'next/link'
import Image from 'next/image'
import { FaUser, FaSignOutAlt, FaMusic } from 'react-icons/fa'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth-actions'
import { showToast } from '@/components/ui/toast'
import LoadingOverlay from '@/components/ui/loading-overlay'

type NavbarProps = {
  user?: {
    $id: string
    name: string
    email: string
    labels: string[]
  } | null
}

// Import logo at the component level for stability
import logoSrc from '../../../public/mm-logo.png'

export default function Navbar({ user }: NavbarProps) {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const userRole = user?.labels?.includes('admin') ? 'admin' : 'competitor'

  const toggleUserMenu = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
  }

  // Close menu when selecting an option
  const closeUserMenu = () => {
    setIsUserMenuOpen(false)
  }

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      const result = await logoutAction()
      if (result.success) {
        showToast.logout('Logged out successfully')
        closeUserMenu() // Close menu after logout action
        if (result.redirectTo) {
          router.push(result.redirectTo)
        }
      } else {
        showToast.error(result.error || 'Logout failed')
      }
    } catch (error) {
      console.error('Logout error:', error)
      showToast.error('Logout failed')
    } finally {
      setIsLoggingOut(false)
    }
  }

  // Handle logo click - if user is logged in, log them out first
  const handleLogoClick = async (e: React.MouseEvent) => {
    if (user) {
      e.preventDefault() // Prevent default navigation
      setIsLoggingOut(true)
      try {
        const result = await logoutAction()
        if (result.success) {
          showToast.logout('Logged out successfully')
          router.push('/')
        } else {
          showToast.error(result.error || 'Logout failed')
        }
      } catch (error) {
        console.error('Logout error:', error)
        showToast.error('Logout failed')
      } finally {
        setIsLoggingOut(false)
      }
    }
    // If user is not logged in, default navigation will occur
  }

  // Determine button color based on user status - explicitly set blue when logged out
  const buttonColorClass = !user
    ? 'text-blue-600 hover:bg-blue-50'
    : userRole === 'admin'
    ? 'text-purple-600 hover:bg-purple-50'
    : 'text-green-600 hover:bg-green-50'

  return (
    <>
      {isLoggingOut && <LoadingOverlay message="Signing out..." />}
      <nav className="w-full py-4 px-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-blue-100 sticky top-0 z-50 shadow-sm backdrop-blur-md">
        <div className="container mx-auto flex justify-between items-center">
          {user ? (
            // If user is logged in, use a button with click handler
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-3 transition-transform hover:scale-105 text-left cursor-pointer"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Image
                  src={logoSrc}
                  alt="Music Manager Logo"
                  width={36}
                  height={36}
                  priority
                  className="rounded-md relative"
                />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Music Manager
              </h1>
            </button>
          ) : (
            // If no user is logged in, use regular Link
            <Link
              href="/"
              className="flex items-center gap-3 transition-transform hover:scale-105"
            >
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <Image
                  src={logoSrc}
                  alt="Music Manager Logo"
                  width={36}
                  height={36}
                  priority
                  className="rounded-md relative"
                />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Music Manager
              </h1>
            </Link>
          )}

          <div className="flex items-center gap-4">
            {user && (
              <Link
                href={userRole === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                <FaMusic className="w-4 h-4" />
                <span>My Music</span>
              </Link>
            )}

            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className={`p-2.5 rounded-full bg-white transition-colors duration-200 flex items-center justify-center border border-blue-100 shadow-sm hover:shadow-md ${buttonColorClass}`}
                aria-label={user ? 'User menu' : 'Login'}
              >
                {isLoggingOut ? (
                  <div className="w-5 h-5 border-2 border-t-current border-r-transparent border-b-current border-l-transparent rounded-full animate-spin"></div>
                ) : (
                  <FaUser className="w-5 h-5" />
                )}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-blue-100 py-2 z-50">
                  {user ? (
                    <>
                      <div className="px-4 py-2 border-b border-blue-50">
                        <p className="text-sm font-medium text-gray-700">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {user.email}
                        </p>
                        <p className="text-xs font-medium mt-1 capitalize">
                          {userRole === 'admin' ? (
                            <span className="text-purple-600">Admin</span>
                          ) : (
                            <span className="text-green-600">Competitor</span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FaSignOutAlt className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={closeUserMenu}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <FaUser className="w-4 h-4" />
                        <span>Login</span>
                      </Link>
                      <Link
                        href="/register"
                        onClick={closeUserMenu}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 hover:bg-green-50 transition-colors"
                      >
                        <FaUser className="w-4 h-4" />
                        <span>Register</span>
                      </Link>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}

'use client'

import Link from 'next/link'
import Image from 'next/image'
import { User, LogOut, Music, Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { logoutAction } from '@/app/actions/auth-actions'
import { showToast } from '@/components/ui/toast'
import LoadingOverlay from '@/components/ui/loading-overlay'
import {
  DEFAULT_THEME,
  THEME_COOKIE_MAX_AGE,
  THEME_COOKIE_NAME,
  type Theme,
} from '@/lib/theme'

type NavbarProps = {
  initialTheme: Theme
  user?: {
    $id: string
    name: string
    email: string
    labels: string[]
  } | null
}

// Import logo at the component level for stability
import logoSrc from '../../../public/mm-logo.png'

export default function Navbar({ initialTheme, user }: NavbarProps) {
  const [theme, setTheme] = useState<Theme>(initialTheme ?? DEFAULT_THEME)
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

  useEffect(() => {
    applyThemeClass(theme)
  }, [theme])

  useEffect(() => {
    setTheme(initialTheme)
  }, [initialTheme])

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
          closeUserMenu()
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
    ? 'text-blue-600 hover:bg-blue-50 dark:text-sky-300 dark:hover:bg-sky-400/10'
    : userRole === 'admin'
    ? 'text-purple-600 hover:bg-purple-50 dark:text-violet-300 dark:hover:bg-violet-400/10'
    : 'text-green-600 hover:bg-green-50 dark:text-emerald-300 dark:hover:bg-emerald-400/10'

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const updatedTheme: Theme =
        currentTheme === 'dark' ? 'light' : 'dark'
      persistThemePreference(updatedTheme)
      return updatedTheme
    })
  }

  return (
    <>
      {isLoggingOut && <LoadingOverlay message="Signing out..." />}
      <nav className="sticky top-0 z-50 w-full border-b border-slate-200/70 bg-gradient-to-r from-white/95 via-slate-50/90 to-indigo-50/90 px-6 py-4 shadow-sm backdrop-blur-xl transition-colors duration-300 dark:border-white/10 dark:from-slate-950/95 dark:via-slate-900/90 dark:to-indigo-950/75">
        <div className="container mx-auto flex justify-between items-center">
          {user ? (
            // If user is logged in, use a button with click handler
            <button
              onClick={handleLogoClick}
              className="group flex cursor-pointer items-center gap-3 text-left transition-transform hover:scale-105"
            >
              <div className="relative flex h-9 w-9 items-center justify-center">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 opacity-30 blur transition duration-300 group-hover:opacity-100 dark:from-sky-400 dark:to-violet-400"></div>
                <Image
                  src={logoSrc}
                  alt="Music Manager Logo"
                  priority
                  className="relative z-10 h-auto w-9 rounded-md"
                />
              </div>
              <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent dark:from-sky-300 dark:to-violet-300">
                Music Manager
              </h1>
            </button>
          ) : (
            // If no user is logged in, use regular Link
            <Link
              href="/"
              className="group flex items-center gap-3 transition-transform hover:scale-105"
            >
              <div className="relative flex h-9 w-9 items-center justify-center">
                <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 opacity-30 blur transition duration-300 group-hover:opacity-100 dark:from-sky-400 dark:to-violet-400"></div>
                <Image
                  src={logoSrc}
                  alt="Music Manager Logo"
                  priority
                  className="relative z-10 h-auto w-9 rounded-md"
                />
              </div>
              <h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent dark:from-sky-300 dark:to-violet-300">
                Music Manager
              </h1>
            </Link>
          )}

          <div className="flex items-center gap-4">
            {user && (
              <Link
                href={userRole === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="hidden items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition-colors hover:text-blue-600 dark:text-slate-300 dark:hover:text-sky-300 md:flex"
              >
                <Music className="w-4 h-4" />
                <span>My Music</span>
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200/70 bg-white/80 text-slate-700 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-white/5 dark:text-amber-200"
              aria-label={`Switch to ${nextTheme} mode`}
              title={`Switch to ${nextTheme} mode`}
              type="button"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className={`flex items-center justify-center rounded-full border border-slate-200/70 bg-white/80 p-2.5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-white/10 dark:bg-white/5 ${buttonColorClass}`}
                aria-label={user ? 'User menu' : 'Login'}
                type="button"
              >
                {isLoggingOut ? (
                  <div className="w-5 h-5 border-2 border-t-current border-r-transparent border-b-current border-l-transparent rounded-full animate-spin"></div>
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-slate-200/80 bg-white/95 py-2 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/95">
                  {user ? (
                    <>
                      <div className="border-b border-slate-200/70 px-4 py-2 dark:border-white/10">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {user.email}
                        </p>
                        <p className="text-xs font-medium mt-1 capitalize">
                          {userRole === 'admin' ? (
                            <span className="text-purple-600 dark:text-violet-300">
                              Admin
                            </span>
                          ) : (
                            <span className="text-green-600 dark:text-emerald-300">
                              Competitor
                            </span>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-500/10"
                        type="button"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={closeUserMenu}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 transition-colors hover:bg-blue-50 dark:text-sky-300 dark:hover:bg-sky-500/10"
                      >
                        <User className="w-4 h-4" />
                        <span>Login</span>
                      </Link>
                      <Link
                        href="/register"
                        onClick={closeUserMenu}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-green-600 transition-colors hover:bg-green-50 dark:text-emerald-300 dark:hover:bg-emerald-500/10"
                      >
                        <User className="w-4 h-4" />
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

function applyThemeClass(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
  document.documentElement.style.colorScheme = theme
}

function persistThemePreference(theme: Theme) {
  try {
    document.cookie = `${THEME_COOKIE_NAME}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; samesite=lax`
  } catch (error) {
    console.error('Failed to persist theme preference:', error)
  }
}

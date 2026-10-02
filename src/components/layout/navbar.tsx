'use client'

import Link from 'next/link'
import { User, LogOut, Music, Moon, Sun, UserPlus } from 'lucide-react'
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

import Logo from '@/components/ui/logo'

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

  const nextTheme = theme === 'dark' ? 'light' : 'dark'

  const toggleTheme = () => {
    setTheme((currentTheme) => {
      const updatedTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark'
      persistThemePreference(updatedTheme)
      return updatedTheme
    })
  }

  const brand = (
    <>
      <Logo className="h-9 w-9 shrink-0" />
      <span className="font-display text-xl font-extrabold tracking-tight">
        Music Manager
      </span>
    </>
  )

  return (
    <>
      {isLoggingOut && <LoadingOverlay message="Signing out..." />}
      <nav className="sticky top-0 z-50 w-full border-b bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {user ? (
              // When signed in, the logo signs the user out (existing behaviour)
              <button
                onClick={handleLogoClick}
                className="flex cursor-pointer items-center gap-3 text-left"
                title="Sign out and return to the home page"
              >
                {brand}
              </button>
            ) : (
              <Link href="/" className="flex items-center gap-3">
                {brand}
              </Link>
            )}
            {user && (
              <span className="hidden rounded-sm bg-primary px-2 py-1 font-mono text-[11px] font-medium tracking-[0.08em] text-primary-foreground uppercase sm:inline">
                {userRole === 'admin' ? 'Admin' : 'Competitor'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {user && (
              <Link
                href={userRole === 'admin' ? '/admin/dashboard' : '/dashboard'}
                className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground md:flex"
              >
                <Music className="h-4 w-4" />
                <span>My Music</span>
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="flex h-10 w-10 items-center justify-center rounded-full border bg-secondary text-muted-foreground transition-colors hover:border-primary hover:text-foreground"
              aria-label={`Switch to ${nextTheme} mode`}
              title={`Switch to ${nextTheme} mode`}
              type="button"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-warning" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            <div className="relative">
              <button
                onClick={toggleUserMenu}
                className="flex h-10 w-10 items-center justify-center rounded-full border bg-secondary text-primary transition-colors hover:border-primary"
                aria-label={user ? 'User menu' : 'Login'}
                aria-expanded={isUserMenuOpen}
                type="button"
              >
                {isLoggingOut ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-r-transparent"></div>
                ) : (
                  <User className="h-5 w-5" />
                )}
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border bg-popover text-popover-foreground shadow-xl shadow-black/20">
                  {user ? (
                    <>
                      <div className="border-b px-4 py-3">
                        <p className="font-semibold">{user.name}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {user.email}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-primary">
                          {userRole === 'admin' ? 'Admin' : 'Competitor'}
                        </p>
                      </div>
                      <button
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-destructive transition-colors hover:bg-accent"
                        type="button"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={closeUserMenu}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <User className="h-4 w-4 text-primary" />
                        <span>Login</span>
                      </Link>
                      <Link
                        href="/register"
                        onClick={closeUserMenu}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
                      >
                        <UserPlus className="h-4 w-4 text-primary" />
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

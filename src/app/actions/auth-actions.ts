'use server'

import { headers } from 'next/headers'
import {
  createSession,
  registerUser,
  logout,
  getCurrentUser,
} from '@/lib/auth/auth-service'
import {
  clientIp,
  describeWait,
  loginEmailLimiter,
  loginIpLimiter,
  registerLimiter,
} from '@/lib/security/rate-limit'

const text = (value: FormDataEntryValue | null) =>
  typeof value === 'string' ? value : ''

export async function loginAction(formData: FormData) {
  try {
    const email = text(formData.get('email')).trim().toLowerCase()
    const password = text(formData.get('password'))

    if (!email || !password) {
      return {
        error: 'Email and password are required',
        success: false,
      }
    }
    if (email.length > 320 || password.length > 256) {
      return { error: 'Invalid email or password', success: false }
    }

    // Stop password guessing: limit failed attempts per address and per account
    const ip = clientIp(await headers())
    const ipLimit = loginIpLimiter()
    const emailLimit = loginEmailLimiter()
    const blocked = [ipLimit.status(ip), emailLimit.status(email)].find(
      (status) => status.blocked
    )
    if (blocked) {
      return {
        error: `Too many sign-in attempts. Try again in ${describeWait(blocked.retryAfterSeconds)}.`,
        success: false,
      }
    }

    try {
      await createSession(email, password)
    } catch (error) {
      ipLimit.hit(ip)
      emailLimit.hit(email)
      throw error
    }
    emailLimit.reset(email)

    // Get user info to determine redirect
    const user = await getCurrentUser()
    if (!user) {
      return {
        error: 'Login successful but session retrieval failed',
        success: false,
      }
    }

    const role = user.labels.includes('admin') ? 'admin' : 'competitor'
    const redirectPath = role === 'admin' ? '/admin/dashboard' : '/dashboard'

    return {
      success: true,
      redirectTo: redirectPath,
    }
  } catch (error) {
    console.error('Login action error:', error)
    return {
      error: 'Invalid email or password',
      success: false,
    }
  }
}

export async function registerAction(formData: FormData) {
  try {
    const email = text(formData.get('email')).trim().toLowerCase()
    const password = text(formData.get('password'))
    const firstName = text(formData.get('firstName')).trim()
    const lastName = text(formData.get('lastName')).trim()

    if (!email || !password || !firstName || !lastName) {
      return {
        error: 'All fields are required',
        success: false,
      }
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 320) {
      return { error: 'Enter a valid email address', success: false }
    }
    if (password.length < 8 || password.length > 256) {
      return {
        error: 'Password must be between 8 and 256 characters',
        success: false,
      }
    }
    if (firstName.length > 100 || lastName.length > 100) {
      return { error: 'Names can be at most 100 characters', success: false }
    }

    // Limit how many accounts one address can create
    const limit = registerLimiter()
    const ip = clientIp(await headers())
    const blocked = limit.hit(ip)
    if (blocked.blocked) {
      return {
        error: `Too many registration attempts. Try again in ${describeWait(blocked.retryAfterSeconds)}.`,
        success: false,
      }
    }

    await registerUser(email, password, firstName, lastName)

    // Instead of creating a session, redirect to login page
    return {
      success: true,
      redirectTo: '/login',
      message: 'Registration successful! Please log in with your credentials.',
    }
  } catch (error) {
    console.error('Registration action error:', error)
    return {
      error: 'Registration failed. Email may already be in use.',
      success: false,
    }
  }
}

export async function logoutAction() {
  try {
    await logout()
    // Return success instead of redirecting
    return {
      success: true,
      redirectTo: '/login',
    }
  } catch (error) {
    console.error('Logout action error:', error)
    return {
      error: 'Logout failed',
      success: false,
    }
  }
}

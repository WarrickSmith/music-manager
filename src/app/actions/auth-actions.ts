'use server'

import {
  createSession,
  registerUser,
  logout,
  getCurrentUser,
} from '@/lib/auth/auth-service'

export async function loginAction(formData: FormData) {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    if (!email || !password) {
      return {
        error: 'Email and password are required',
        success: false,
      }
    }

    await createSession(email, password)

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
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string

    if (!email || !password || !firstName || !lastName) {
      return {
        error: 'All fields are required',
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

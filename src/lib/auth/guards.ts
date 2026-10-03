import { cache } from 'react'
import { getCurrentUser } from '@/lib/auth/auth-service'

export interface SessionUser {
  $id: string
  name: string
  email: string
  labels: string[]
}

/** Why a request was refused. 401 means signed out, 403 means not allowed. */
export class AuthError extends Error {
  constructor(
    message: string,
    public status: 401 | 403
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

export const NOT_SIGNED_IN_MESSAGE = 'Please sign in again.'
export const FORBIDDEN_MESSAGE = 'You do not have permission to do that.'

/** Message for actions that return a result instead of throwing */
export const ADMIN_ONLY_MESSAGE = 'Only admins can do this.'

/**
 * The signed-in user from the session cookie, or null when signed out.
 * Cached for the length of one request so several checks cost one lookup.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const user = await getCurrentUser()
  if (!user) return null
  return {
    $id: user.$id,
    name: user.name ?? '',
    email: user.email ?? '',
    labels: user.labels ?? [],
  }
})

export function isAdminUser(user: SessionUser | null): boolean {
  return !!user && user.labels.includes('admin')
}

/** The admin user, or null when signed out or not an admin */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  return isAdminUser(user) ? user : null
}

/**
 * Every server action calls one of these first. They throw AuthError rather
 * than returning, so a caller that forgets to handle the result still stops.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser()
  if (!user) throw new AuthError(NOT_SIGNED_IN_MESSAGE, 401)
  return user
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser()
  if (!isAdminUser(user)) throw new AuthError(FORBIDDEN_MESSAGE, 403)
  return user
}

/** The signed-in user, who must be `userId` themselves or an admin */
export async function requireSelfOrAdmin(userId: string): Promise<SessionUser> {
  const user = await requireUser()
  if (user.$id !== userId && !isAdminUser(user)) {
    throw new AuthError(FORBIDDEN_MESSAGE, 403)
  }
  return user
}

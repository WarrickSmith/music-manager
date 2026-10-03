import { getCurrentUser } from '@/lib/auth/auth-service'

export interface SessionUser {
  $id: string
  name: string
  email: string
  labels: string[]
}

/** The signed-in user from the session cookie, or null when signed out */
export async function getSessionUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser()
  if (!user) return null
  return {
    $id: user.$id,
    name: user.name ?? '',
    email: user.email ?? '',
    labels: user.labels ?? [],
  }
}

export function isAdminUser(user: SessionUser | null): boolean {
  return !!user && user.labels.includes('admin')
}

/** Message to show when an admin-only action is attempted by someone else */
export const ADMIN_ONLY_MESSAGE = 'Only admins can do this.'

/**
 * Returns the admin user, or null when the caller is signed out or not an
 * admin. Callers return their own "admin only" result when this is null.
 */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getSessionUser()
  return isAdminUser(user) ? user : null
}

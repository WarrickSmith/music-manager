import { getCurrentUser, getUserRole } from '@/lib/auth/auth-service'
import { redirect } from 'next/navigation'

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const role = await getUserRole(user.$id)

  // If user is not admin, redirect to competitor dashboard
  if (role !== 'admin') {
    redirect('/dashboard')
  }

  return <div className="container mx-auto px-4 py-8">{children}</div>
}

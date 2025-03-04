import { getCurrentUser, getUserRole } from '@/lib/auth/auth-service'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  const role = await getUserRole(user.$id)

  // If user is admin, redirect to admin dashboard
  if (role === 'admin') {
    redirect('/admin/dashboard')
  }

  return <div className="container mx-auto px-4 py-8">{children}</div>
}

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

  return <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">{children}</div>
}

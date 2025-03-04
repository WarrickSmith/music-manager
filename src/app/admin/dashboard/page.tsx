import { getCurrentUser } from '@/lib/auth/auth-service'
import AdminView from '@/components/dashboard/admin-view'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Welcome, {user?.name || 'Admin'}
          </div>
        </div>
      </div>
      <div className="border-b" />
      <AdminView />
    </div>
  )
}

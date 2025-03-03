import { getCurrentUser } from '@/lib/auth/auth-service'
import CompetitorView from '@/components/dashboard/competitor-view'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">
          Competitor Dashboard
        </h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Welcome, {user?.name || 'Competitor'}
          </div>
        </div>
      </div>
      <div className="border-b" />
      <CompetitorView />
    </div>
  )
}

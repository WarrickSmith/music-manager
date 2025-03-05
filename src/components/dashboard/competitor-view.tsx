import { getCurrentUser } from '@/lib/auth/auth-service'
import CompetitorDashboard from './competitor/competitor-dashboard'

export default async function CompetitorView() {
  const user = await getCurrentUser()

  if (!user) {
    return <div>You must be logged in to view this page.</div>
  }

  return (
    <div className="p-8">
      <CompetitorDashboard userId={user.$id} />
    </div>
  )
}

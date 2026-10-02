import DashboardShell from '@/components/layout/dashboard-shell'
import PageHeader from '@/components/layout/page-header'
import { getCurrentUser } from '@/lib/auth/auth-service'
import {
  Music,
  Trophy,
  Users,
  UserCog,
  Database,
  ClipboardList,
} from 'lucide-react'
import CompetitionManagement from '@/components/dashboard/admin/competition-management'
import EntriesManagement from '@/components/dashboard/admin/entries-management'
import UserManagement from '@/components/dashboard/admin/user-management'
import AdminProfileManagement from '@/components/dashboard/admin/profile-management'
import MusicFileManagement from '@/components/dashboard/admin/music-file-management'
import AppwriteInitializationWrapper from '@/components/dashboard/admin/appwrite-initialization-wrapper'
import { checkAppwriteInitialization } from '@/lib/appwrite/initialization-service'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  // Check if Appwrite is initialized to determine default tab
  let defaultTab = 'musicfiles' // Default to music files if everything is okay

  try {
    const initStatus = await checkAppwriteInitialization()
    if (!initStatus.isInitialized) {
      defaultTab = 'appwrite' // Switch to appwrite setup tab if not initialized
    }
  } catch (error) {
    console.error('Failed to check Appwrite initialization status:', error)
    defaultTab = 'appwrite' // Default to appwrite tab on error as a precaution
  }

  return (
    <DashboardShell
      heading="Admin"
      name={user?.name || 'Admin'}
      defaultValue={defaultTab}
      items={[
        {
          value: 'musicfiles',
          label: 'Music Files',
          icon: <Music />,
          content: <MusicFileManagement />,
        },
        {
          value: 'competitions',
          label: 'Competitions',
          icon: <Trophy />,
          content: <CompetitionManagement />,
        },
        {
          value: 'entries',
          label: 'Entries',
          icon: <ClipboardList />,
          content: <EntriesManagement />,
        },
        {
          value: 'users',
          label: 'Users',
          icon: <Users />,
          content: <UserManagement />,
        },
        {
          value: 'profile',
          label: 'My Profile',
          icon: <UserCog />,
          content: <AdminProfileManagement />,
        },
        {
          value: 'appwrite',
          label: 'Setup',
          icon: <Database />,
          content: (
            <>
              <PageHeader
                title="Backend Setup"
                description="See exactly which database, tables, storage and teams the app needs, and create any that are missing."
              />
              <AppwriteInitializationWrapper />
            </>
          ),
        },
      ]}
    />
  )
}

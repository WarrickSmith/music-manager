import { Suspense } from 'react'
import DashboardShell from '@/components/layout/dashboard-shell'
import MyFiles from './my-files'
import UploadMusic from './upload-music'
import ProfileManagement from './profile-management'
import { FileMusic, Upload, UserCog } from 'lucide-react'
import LocalLoadingCard from '@/components/ui/local-loading-card'

export default function CompetitorDashboard({
  userId,
  userName,
}: {
  userId: string
  userName: string
}) {
  return (
    <DashboardShell
      heading="Competitor"
      name={userName}
      defaultValue="my-files"
      items={[
        {
          value: 'my-files',
          label: 'My Music',
          icon: FileMusic,
          content: (
            <Suspense
              fallback={
                <LocalLoadingCard message="Loading files..." minHeight="200px" />
              }
            >
              <MyFiles userId={userId} />
            </Suspense>
          ),
        },
        {
          value: 'upload',
          label: 'Upload',
          icon: Upload,
          content: (
            <Suspense
              fallback={
                <LocalLoadingCard
                  message="Loading upload form..."
                  minHeight="200px"
                />
              }
            >
              <UploadMusic userId={userId} />
            </Suspense>
          ),
        },
        {
          value: 'profile',
          label: 'My Profile',
          icon: UserCog,
          content: (
            <Suspense
              fallback={
                <LocalLoadingCard message="Loading profile..." minHeight="200px" />
              }
            >
              <ProfileManagement userId={userId} />
            </Suspense>
          ),
        },
      ]}
    />
  )
}

import { Suspense } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
    <div className="w-full">
      <div className="bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 rounded-lg p-6 mb-8 shadow-sm border border-blue-100">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-500">
            Competitor Dashboard
          </h1>
          <div className="bg-white px-4 py-2 rounded-full shadow-sm text-blue-600 font-medium border border-blue-100">
            Welcome, {userName}
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-files" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 p-1 bg-slate-50 rounded-xl shadow-sm border border-slate-200">
          <TabsTrigger
            value="my-files"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-sky-400 data-[state=active]:text-white"
          >
            <FileMusic className="h-4 w-4 mr-2" />
            Music
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-700 data-[state=active]:to-emerald-600 data-[state=active]:text-white"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Music
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-violet-400 data-[state=active]:text-white"
          >
            <UserCog className="h-4 w-4 mr-2" />
            My Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-files" className="mt-6">
          <div className="rounded-lg border border-sky-100 bg-white p-6 shadow-sm">
            <Suspense
              fallback={
                <LocalLoadingCard
                  message="Loading files..."
                  minHeight="200px"
                />
              }
            >
              <MyFiles userId={userId} />
            </Suspense>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <div className="rounded-lg border border-emerald-200 bg-white p-6 shadow-sm">
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
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <div className="rounded-lg border border-violet-100 bg-white p-6 shadow-sm">
            <Suspense
              fallback={
                <LocalLoadingCard
                  message="Loading profile..."
                  minHeight="200px"
                />
              }
            >
              <ProfileManagement userId={userId} />
            </Suspense>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

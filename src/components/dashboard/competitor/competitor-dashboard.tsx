import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import MyFiles from './my-files'
import UploadMusic from './upload-music'
import ProfileManagement from './profile-management'
import { FileMusic, Upload, UserCog } from 'lucide-react'

export default function CompetitorDashboard({ userId }: { userId: string }) {
  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-500 to-blue-500 mb-6">
        Competitor Dashboard
      </h1>

      <Tabs defaultValue="my-files" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 p-1 bg-slate-50 rounded-xl shadow-sm border border-slate-200">
          <TabsTrigger
            value="my-files"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-500 data-[state=active]:to-sky-400 data-[state=active]:text-white"
          >
            <FileMusic className="h-4 w-4 mr-2" />
            My Files
          </TabsTrigger>
          <TabsTrigger
            value="upload"
            className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-emerald-400 data-[state=active]:text-white"
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
            <MyFiles userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <div className="rounded-lg border border-emerald-100 bg-white p-6 shadow-sm">
            <UploadMusic userId={userId} />
          </div>
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <div className="rounded-lg border border-violet-100 bg-white p-6 shadow-sm">
            <ProfileManagement userId={userId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

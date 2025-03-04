import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from 'sonner'
import { getCurrentUser } from '@/lib/auth/auth-service'
import { Music, Trophy, Users, UserCog } from 'lucide-react'

export default async function AdminDashboardPage() {
  const user = await getCurrentUser()

  return (
    <>
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-lg p-6 mb-8 shadow-sm border border-indigo-100">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
              Admin Dashboard
            </h1>
            <div className="bg-white px-4 py-2 rounded-full shadow-sm text-indigo-600 font-medium border border-indigo-100">
              Welcome, {user?.name || 'Admin'}
            </div>
          </div>
        </div>

        <Tabs defaultValue="musicfiles" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8 p-1 bg-slate-50 rounded-xl shadow-sm border border-slate-200">
            <TabsTrigger
              value="musicfiles"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-400 data-[state=active]:text-white"
            >
              <Music className="h-4 w-4 mr-2" />
              Music Files
            </TabsTrigger>
            <TabsTrigger
              value="competitions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-400 data-[state=active]:text-white"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Competition & Grades
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-400 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-violet-400 data-[state=active]:text-white"
            >
              <UserCog className="h-4 w-4 mr-2" />
              Admin Profile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="competitions" className="mt-6">
            {/* Competition & Grade Management Component */}
            <div className="rounded-lg border border-indigo-100 bg-white p-8 text-center shadow-sm">
              <div className="rounded-full bg-indigo-50 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-indigo-700">
                Competition and Grade Management
              </h2>
              <p className="text-slate-500">
                Coming Soon in Step 2 of the implementation plan
              </p>
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {/* User Management Component */}
            <div className="rounded-lg border border-blue-100 bg-white p-8 text-center shadow-sm">
              <div className="rounded-full bg-blue-50 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-blue-700">
                User Management
              </h2>
              <p className="text-slate-500">
                Coming Soon in Step 4 of the implementation plan
              </p>
            </div>
          </TabsContent>

          <TabsContent value="musicfiles" className="mt-6">
            {/* Music File Management Component */}
            <div className="rounded-lg border border-purple-100 bg-white p-8 text-center shadow-sm">
              <div className="rounded-full bg-purple-50 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Music className="h-8 w-8 text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-purple-700">
                Music File Management
              </h2>
              <p className="text-slate-500">
                Coming Soon in Phase 5 of the project
              </p>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            {/* Admin Profile Component */}
            <div className="rounded-lg border border-violet-100 bg-white p-8 text-center shadow-sm">
              <div className="rounded-full bg-violet-50 p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <UserCog className="h-8 w-8 text-violet-400" />
              </div>
              <h2 className="text-xl font-semibold mb-2 text-violet-700">
                Admin Profile Management
              </h2>
              <p className="text-slate-500">
                Coming Soon in Step 5 of the implementation plan
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Toaster position="bottom-right" />
    </>
  )
}

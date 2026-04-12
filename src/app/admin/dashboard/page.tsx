import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Toaster } from 'sonner'
import { getCurrentUser } from '@/lib/auth/auth-service'
import { Music, Trophy, Users, UserCog, Database } from 'lucide-react'
import CompetitionManagement from '@/components/dashboard/admin/competition-management'
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
    <>
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="app-shell-banner mb-8 p-6">
          <div className="flex items-center justify-between">
            <h1 className="bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-3xl font-bold text-transparent dark:from-sky-300 dark:to-violet-300">
              Admin Dashboard
            </h1>
            <div className="rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 font-medium text-indigo-600 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-sky-200">
              Welcome, {user?.name || 'Admin'}
            </div>
          </div>
        </div>
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-5 rounded-2xl border border-slate-200/70 bg-slate-100/80 p-1 shadow-sm dark:border-white/10 dark:bg-white/5">
            <TabsTrigger
              value="musicfiles"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-400 data-[state=active]:text-white"
            >
              <Music className="h-4 w-4 mr-2" />
              Music
            </TabsTrigger>
            <TabsTrigger
              value="competitions"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-500 data-[state=active]:to-indigo-400 data-[state=active]:text-white"
            >
              <Trophy className="h-4 w-4 mr-2" />
              Competitions
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-400 data-[state=active]:text-white"
            >
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-violet-400 data-[state=active]:text-white"
            >
              <UserCog className="h-4 w-4 mr-2" />
              My Profile
            </TabsTrigger>
            <TabsTrigger
              value="appwrite"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-400 data-[state=active]:text-white"
            >
              <Database className="h-4 w-4 mr-2" />
              Setup
            </TabsTrigger>
          </TabsList>

          <TabsContent value="musicfiles" className="mt-6">
            {/* Music File Management Component */}
            <div className="app-panel p-8">
              <MusicFileManagement />
            </div>
          </TabsContent>

          <TabsContent value="competitions" className="mt-6">
            {/* Competition & Grade Management Component */}
            <div className="app-panel p-6">
              <CompetitionManagement />
            </div>
          </TabsContent>

          <TabsContent value="users" className="mt-6">
            {/* User Management Component */}
            <div className="app-panel p-6">
              <UserManagement />
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            {/* Admin Profile Component */}
            <div className="app-panel p-6">
              <AdminProfileManagement />
            </div>
          </TabsContent>

          <TabsContent value="appwrite" className="mt-6">
            {/* Appwrite Initialization Component */}
            <div className="app-panel p-6">
              <div className="mb-6">
                <h2 className="mb-2 text-3xl font-bold text-green-700 dark:text-emerald-300">
                  Appwrite Backend Setup
                </h2>
                <p className="text-muted-foreground">
                  Check the status of your Appwrite backend resources and
                  initialize them if needed.
                </p>
              </div>
              <AppwriteInitializationWrapper />
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <Toaster position="bottom-right" />
    </>
  )
}

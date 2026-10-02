'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { getUserMusicFiles } from '@/app/actions/music-file-actions'
import { getCompetitionDeadlines } from '@/app/actions/competition-actions'
import LocalLoadingCard from '@/components/ui/local-loading-card'
import ErrorNotice from '@/components/ui/error-notice'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/layout/page-header'
import { useDashboardTab } from '@/components/layout/dashboard-shell'
import OutstandingMusicPanel from './outstanding-music'
import MusicFilesView from '@/components/music/music-files-view'
import type { MusicFile } from '@/components/music/types'

export default function MyFiles({ userId }: { userId: string }) {
  const goToTab = useDashboardTab()
  const [files, setFiles] = useState<MusicFile[]>([])
  const [deadlines, setDeadlines] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [userFiles, competitionDeadlines] = await Promise.all([
        getUserMusicFiles(userId),
        getCompetitionDeadlines(),
      ])
      setFiles(userFiles as unknown as MusicFile[])
      setDeadlines(competitionDeadlines)
    } catch (err) {
      console.error('Error loading music files:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="My Music"
        description="Your uploaded programmes. Filter by competition, grade or segment."
        actions={
          goToTab && (
            <Button onClick={() => goToTab('upload')}>
              <Plus /> Upload music
            </Button>
          )
        }
      />

      <OutstandingMusicPanel userId={userId} />

      {isLoading ? (
        <LocalLoadingCard
          message="Loading your music files..."
          minHeight="200px"
        />
      ) : error ? (
        <ErrorNotice
          title="Could not load your music files"
          message="Your files could not be loaded. Check your connection and try again."
          details={error}
          onRetry={load}
        />
      ) : (
        <MusicFilesView
          files={files}
          isAdmin={false}
          deadlines={deadlines}
          emptyMessage="You haven't uploaded any music yet. Use Upload to add your first file."
          onFileDeleted={(id) =>
            setFiles((prev) => prev.filter((f) => f.$id !== id))
          }
        />
      )}
    </div>
  )
}

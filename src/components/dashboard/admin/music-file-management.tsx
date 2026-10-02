'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { getAllMusicFiles } from '@/app/actions/music-file-actions'
import LocalLoadingCard from '@/components/ui/local-loading-card'
import ErrorNotice from '@/components/ui/error-notice'
import { Button } from '@/components/ui/button'
import PageHeader from '@/components/layout/page-header'
import MusicFilesView from '@/components/music/music-files-view'
import type { MusicFile } from '@/components/music/types'

export default function MusicFileManagement() {
  const [files, setFiles] = useState<MusicFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const all = await getAllMusicFiles()
      setFiles(all as unknown as MusicFile[])
    } catch (err) {
      console.error('Error fetching music files:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Music Files"
        description="Every file uploaded across all competitions. Filter, then play, download or remove."
        actions={
          <Button variant="outline" onClick={load} disabled={isLoading}>
            <RefreshCw className={isLoading ? 'animate-spin' : ''} /> Refresh
          </Button>
        }
      />

      {isLoading ? (
        <LocalLoadingCard message="Loading music files..." minHeight="300px" />
      ) : error ? (
        <ErrorNotice
          title="Could not load music files"
          message="The music files could not be loaded. Check that the backend is set up on the Setup tab, then try again."
          details={error}
          onRetry={load}
        />
      ) : (
        <MusicFilesView
          files={files}
          isAdmin
          emptyMessage="No music files yet. Files appear here once competitors upload them."
          onFileDeleted={(id) =>
            setFiles((prev) => prev.filter((f) => f.$id !== id))
          }
        />
      )}
    </div>
  )
}

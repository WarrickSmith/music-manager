'use client'

import { useState, useEffect } from 'react'
import { getUserMusicFiles } from '@/app/actions/music-file-actions'
import FileCard from './file-card'
import LoadingOverlay from '@/components/ui/loading-overlay'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

type MusicFile = {
  $id: string
  fileId: string
  fileName: string
  originalName: string
  competitionName: string
  competitionYear: number
  gradeType: string
  gradeCategory: string
  gradeSegment: string
  uploadedAt: string
  size: number
  status: string
  storagePath: string
}

export default function MyFiles({ userId }: { userId: string }) {
  const [files, setFiles] = useState<MusicFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Function to trigger a refresh when a file is deleted
  const handleFileDeleted = () => {
    setRefreshTrigger((prev) => prev + 1)
  }

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        setIsLoading(true)
        const userFiles = await getUserMusicFiles(userId)
        setFiles(userFiles as unknown as MusicFile[])
      } catch (error) {
        toast.error('Failed to load your music files')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFiles()
  }, [userId, refreshTrigger]) // Added refreshTrigger to dependencies to reload when triggered

  // Group files by competition
  const filesByCompetition = files.reduce(
    (acc: Record<string, MusicFile[]>, file) => {
      const key = `${file.competitionYear}-${file.competitionName}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(file)
      return acc
    },
    {} as Record<string, MusicFile[]>
  )

  // Sort competitions by year (descending)
  const sortedCompetitions = Object.keys(filesByCompetition).sort((a, b) => {
    const yearA = parseInt(a.split('-')[0])
    const yearB = parseInt(b.split('-')[0])
    return yearB - yearA
  })

  if (isLoading) {
    return <LoadingOverlay message="Loading your music files..." />
  }

  if (files.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-2xl font-semibold mb-4 text-sky-500">
          My Music Files
        </h2>
        <p className="text-sky-400 mb-4">
          You haven&apos;t uploaded any music files yet.
        </p>
        <p className="text-sky-400">
          Use the <span className="font-medium">Upload Music</span> tab to add
          your first music file.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-sky-500">
        My Music Files
      </h2>
      {/* Fix: Move Badge outside of p tag to prevent hydration error */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-sky-400">Total Files:</span>
        <Badge variant="outline">{files.length}</Badge>
      </div>

      {sortedCompetitions.map((competition) => (
        <div key={competition} className="mb-8">
          <h3 className="text-xl font-medium mb-4 text-sky-500">
            {competition}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filesByCompetition[competition].map((file) => (
              <FileCard
                key={file.$id}
                file={{
                  id: file.$id,
                  fileId: file.fileId,
                  fileName: file.fileName,
                  originalName: file.originalName,
                  competitionName: file.competitionName,
                  competitionYear: file.competitionYear,
                  gradeType: file.gradeType,
                  gradeCategory: file.gradeCategory,
                  gradeSegment: file.gradeSegment,
                  uploadedAt: file.uploadedAt,
                  size: file.size,
                  status: file.status,
                  storagePath: file.storagePath,
                }}
                onDeleteSuccess={handleFileDeleted}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

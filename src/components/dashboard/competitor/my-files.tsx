'use client'

import { useState, useEffect } from 'react'
import { getUserMusicFiles } from '@/app/actions/music-file-actions'
import FileCard from './file-card'
import LocalLoadingCard from '@/components/ui/local-loading-card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Filter } from 'lucide-react'

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
  duration?: number | null
}

export default function MyFiles({ userId }: { userId: string }) {
  const [files, setFiles] = useState<MusicFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false) // Separate state for refresh operations
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all')
  // Track files being deleted to avoid full refresh
  const [deletingFileIds, setDeletingFileIds] = useState<string[]>([])

  // Function to mark a file as being deleted
  const handleFileDeleting = (fileId: string) => {
    setDeletingFileIds((prev) => [...prev, fileId])
  }

  // Function to trigger a refresh when a file is deleted
  const handleFileDeleted = (fileId: string) => {
    // Use optimistic UI update - remove the file from the local state immediately
    setFiles((prev) => prev.filter((file) => file.$id !== fileId))
    // Remove from deleting list
    setDeletingFileIds((prev) => prev.filter((id) => id !== fileId))
    // Also trigger a background refresh to ensure data consistency
    refreshFilesInBackground()
  }

  // Function to refresh files without showing loading state
  const refreshFilesInBackground = async () => {
    try {
      setIsRefreshing(true)
      const userFiles = await getUserMusicFiles(userId)
      setFiles(userFiles as unknown as MusicFile[])
    } catch (error) {
      console.error('Background refresh error:', error)
      // Don't show error toast during background refresh
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        // Only show loading indicator on initial load, not refreshes
        if (!isRefreshing) {
          setIsLoading(true)
        }
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
  }, [userId, isRefreshing]) // Updated dependencies

  // Extract all unique years and competitions
  const uniqueYears = Array.from(
    new Set(files.map((file) => file.competitionYear))
  ).sort((a, b) => b - a)
  const uniqueCompetitions = Array.from(
    new Set(files.map((file) => file.competitionName))
  ).sort((a, b) => a.localeCompare(b))

  // Filter files based on selected year and competition
  const filteredFiles = files.filter((file) => {
    const yearMatch =
      selectedYear === 'all' || file.competitionYear.toString() === selectedYear
    const competitionMatch =
      selectedCompetition === 'all' ||
      file.competitionName === selectedCompetition
    return yearMatch && competitionMatch
  })

  // Group filtered files by competition
  const filesByCompetition = filteredFiles.reduce(
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

  // Handle year filter change
  const handleYearChange = (year: string) => {
    setSelectedYear(year)
  }

  // Handle competition filter change
  const handleCompetitionChange = (competition: string) => {
    setSelectedCompetition(competition)
  }

  if (isLoading) {
    return (
      <LocalLoadingCard
        message="Loading your music files..."
        minHeight="200px"
      />
    )
  }

  if (files.length === 0) {
    return (
      <div className="py-10 text-center">
        <h2 className="mb-4 text-2xl font-semibold text-sky-500 dark:text-sky-300">
          My Music Files
        </h2>
        <p className="mb-4 text-sky-500/80 dark:text-sky-200/80">
          You haven&apos;t uploaded any music files yet.
        </p>
        <p className="text-sky-500/80 dark:text-sky-200/80">
          Use the <span className="font-medium">Upload Music</span> tab to add
          your first music file.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="mb-4 text-2xl font-semibold text-sky-500 dark:text-sky-300">
        My Music Files
      </h2>

      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sky-500/80 dark:text-sky-200/80">
            Total Files:
          </span>
          <Badge variant="outline">{files.length}</Badge>
          <Badge
            variant="outline"
            className="ml-2 bg-sky-100 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
          >
            Showing: {filteredFiles.length}
          </Badge>
        </div>

        <div className="w-full rounded-2xl border border-sky-100 bg-sky-50/80 p-4 dark:border-sky-500/20 dark:bg-sky-950/20">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-5 w-5 text-sky-500 dark:text-sky-300" />
            <span className="font-semibold text-sky-600 dark:text-sky-200">
              Filter Music Files
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-1 sm:col-span-1">
              <label className="mb-1 block text-sm font-medium text-sky-500 dark:text-sky-200">
                Year
              </label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full border-sky-200 bg-gradient-to-r from-sky-50 to-sky-100 text-sky-600 transition-all hover:from-sky-100 hover:to-sky-200 dark:border-sky-500/30 dark:from-slate-900 dark:to-sky-950/60 dark:text-sky-200 dark:hover:from-slate-900 dark:hover:to-sky-900/70">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent className="border-sky-200 dark:border-sky-500/30">
                  <SelectItem
                    value="all"
                    className="font-medium text-sky-600 dark:text-sky-200"
                  >
                    All Years
                  </SelectItem>
                  {uniqueYears.map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className="text-sky-600 dark:text-sky-200"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 sm:col-span-1 md:col-span-2">
              <label className="mb-1 block text-sm font-medium text-indigo-500 dark:text-indigo-200">
                Competition
              </label>
              <Select
                value={selectedCompetition}
                onValueChange={handleCompetitionChange}
              >
                <SelectTrigger className="w-full border-indigo-200 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-600 transition-all hover:from-indigo-100 hover:to-indigo-200 dark:border-indigo-500/30 dark:from-slate-900 dark:to-indigo-950/60 dark:text-indigo-200 dark:hover:from-slate-900 dark:hover:to-indigo-900/70">
                  <SelectValue placeholder="Select Competition" />
                </SelectTrigger>
                <SelectContent className="max-h-60 border-indigo-200 dark:border-indigo-500/30">
                  <SelectItem
                    value="all"
                    className="font-medium text-indigo-600 dark:text-indigo-200"
                  >
                    All Competitions
                  </SelectItem>
                  {uniqueCompetitions.map((comp) => (
                    <SelectItem
                      key={comp}
                      value={comp}
                      className="text-indigo-600 dark:text-indigo-200"
                    >
                      {comp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {filteredFiles.length === 0 ? (
        <div className="rounded-2xl border border-sky-200 bg-sky-50/80 py-6 text-center dark:border-sky-500/20 dark:bg-sky-950/20">
          <p className="mb-2 text-sky-500 dark:text-sky-300">
            No files match the selected filters
          </p>
          <p className="text-sm text-sky-500/80 dark:text-sky-200/80">
            Try selecting different filter options
          </p>
        </div>
      ) : (
        sortedCompetitions.map((competition) => (
          <div key={competition} className="mb-8">
            <h3 className="mb-4 text-xl font-medium text-sky-500 dark:text-sky-300">
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
                    duration: file.duration,
                  }}
                  isDeleting={deletingFileIds.includes(file.$id)}
                  onDeleteStart={() => handleFileDeleting(file.$id)}
                  onDeleteSuccess={() => handleFileDeleted(file.$id)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

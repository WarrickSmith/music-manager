'use client'

import { useState, useEffect } from 'react'
import { getUserMusicFiles } from '@/app/actions/music-file-actions'
import FileCard from './file-card'
import LoadingOverlay from '@/components/ui/loading-overlay'
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
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all')

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

      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sky-400">Total Files:</span>
          <Badge variant="outline">{files.length}</Badge>
          <Badge variant="outline" className="ml-2 bg-sky-100 text-sky-600">
            Showing: {filteredFiles.length}
          </Badge>
        </div>

        <div className="w-full bg-sky-50 border border-sky-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-5 w-5 text-sky-500" />
            <span className="text-sky-600 font-semibold">
              Filter Music Files
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div className="col-span-1 sm:col-span-1">
              <label className="text-sm font-medium text-sky-500 mb-1 block">
                Year
              </label>
              <Select value={selectedYear} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full bg-gradient-to-r from-sky-50 to-sky-100 border-sky-200 text-sky-600 hover:from-sky-100 hover:to-sky-200 transition-all">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent className="bg-white border-sky-200">
                  <SelectItem value="all" className="text-sky-600 font-medium">
                    All Years
                  </SelectItem>
                  {uniqueYears.map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className="text-sky-600"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-1 sm:col-span-1 md:col-span-2">
              <label className="text-sm font-medium text-indigo-500 mb-1 block">
                Competition
              </label>
              <Select
                value={selectedCompetition}
                onValueChange={handleCompetitionChange}
              >
                <SelectTrigger className="w-full bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-600 hover:from-indigo-100 hover:to-indigo-200 transition-all">
                  <SelectValue placeholder="Select Competition" />
                </SelectTrigger>
                <SelectContent className="bg-white border-indigo-200 max-h-60">
                  <SelectItem
                    value="all"
                    className="text-indigo-600 font-medium"
                  >
                    All Competitions
                  </SelectItem>
                  {uniqueCompetitions.map((comp) => (
                    <SelectItem
                      key={comp}
                      value={comp}
                      className="text-indigo-600"
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
        <div className="text-center py-6 bg-sky-50 rounded-lg border border-sky-200">
          <p className="text-sky-500 mb-2">
            No files match the selected filters
          </p>
          <p className="text-sky-400 text-sm">
            Try selecting different filter options
          </p>
        </div>
      ) : (
        sortedCompetitions.map((competition) => (
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
                    duration: file.duration,
                  }}
                  onDeleteSuccess={handleFileDeleted}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import LocalLoadingCard from '@/components/ui/local-loading-card'
import { Progress } from '@/components/ui/progress'
import {
  Download,
  Filter,
  Search,
  RefreshCw,
  Trash2,
  FileDown,
} from 'lucide-react'
import { formatFileSize, formatDate, formatDuration } from '@/lib/utils'
import {
  getMusicFileDownloadUrl,
  deleteMusicFile,
} from '@/app/actions/music-file-actions'
import { getAllMusicFiles } from '@/app/actions/music-file-actions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

// Define interface for music file data
interface MusicFile {
  $id: string
  fileId: string
  originalName: string
  fileName: string
  storagePath: string
  competitionId: string
  competitionName: string
  competitionYear: number
  gradeId: string
  gradeType: string
  gradeCategory: string
  gradeSegment: string
  userId: string
  userName: string
  uploadedAt: string
  duration?: number
  size: number
  status: string
}

export default function MusicFileManagement() {
  const [musicFiles, setMusicFiles] = useState<MusicFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<MusicFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Track if this is initial load to avoid showing toast
  const isInitialLoad = useRef(true)

  // Bulk download state
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [currentFileIndex, setCurrentFileIndex] = useState(0)
  const [totalFilesToDownload, setTotalFilesToDownload] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  // Filter states
  const [yearFilter, setYearFilter] = useState<string>('all')
  const [competitionFilter, setCompetitionFilter] = useState<string>('all')
  const [gradeFilter, setGradeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [segmentFilter, setSegmentFilter] = useState<string>('all')
  const [competitorFilter, setCompetitorFilter] = useState<string>('all')

  // Available filter options
  const [years, setYears] = useState<string[]>([])
  const [competitions, setCompetitions] = useState<string[]>([])
  const [grades, setGrades] = useState<string[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [segments, setSegments] = useState<string[]>([])
  const [competitors, setCompetitors] = useState<string[]>([])

  // Add a ref for download links
  const downloadLinkRef = useRef<HTMLAnchorElement | null>(null)

  // Fetch all music files
  const fetchMusicFiles = async (showSuccessToast = false) => {
    try {
      setIsLoading(true)
      const files = await getAllMusicFiles()

      // Convert Appwrite Documents to our MusicFile interface type
      const typedFiles = files.map((file) => file as unknown as MusicFile)

      setMusicFiles(typedFiles)
      setFilteredFiles(typedFiles)

      // Extract unique filter options
      const uniqueYears = [
        ...new Set(
          typedFiles.map((file) => file.competitionYear?.toString() || '')
        ),
      ].filter(Boolean)
      const uniqueCompetitions = [
        ...new Set(typedFiles.map((file) => file.competitionName || '')),
      ].filter(Boolean)
      const uniqueGrades = [
        ...new Set(typedFiles.map((file) => file.gradeType || '')),
      ].filter(Boolean)
      const uniqueCategories = [
        ...new Set(typedFiles.map((file) => file.gradeCategory || '')),
      ].filter(Boolean)
      const uniqueSegments = [
        ...new Set(typedFiles.map((file) => file.gradeSegment || '')),
      ].filter(Boolean)
      const uniqueCompetitors = [
        ...new Set(typedFiles.map((file) => file.userName || '')),
      ].filter(Boolean)

      setYears(uniqueYears.sort((a, b) => b.localeCompare(a))) // Sort years descending
      setCompetitions(uniqueCompetitions.sort())
      setGrades(uniqueGrades.sort())
      setCategories(uniqueCategories.sort())
      setSegments(uniqueSegments.sort())
      setCompetitors(uniqueCompetitors.sort())

      // Only show success toast if explicitly requested (i.e., not on initial load)
      if (showSuccessToast) {
        toast.success('Music files loaded successfully')
      }
    } catch (error) {
      console.error('Error fetching music files:', error)
      toast.error('Failed to load music files')
    } finally {
      setIsLoading(false)
      // Initial load is complete
      isInitialLoad.current = false
    }
  }

  useEffect(() => {
    // Initial load, don't show success toast
    fetchMusicFiles(false)
  }, [])

  // Apply filters and search
  useEffect(() => {
    const applyFilters = () => {
      let result = [...musicFiles]

      // Apply each filter if set
      if (yearFilter && yearFilter !== 'all') {
        result = result.filter(
          (file) => file.competitionYear?.toString() === yearFilter
        )
      }

      if (competitionFilter && competitionFilter !== 'all') {
        result = result.filter(
          (file) => file.competitionName === competitionFilter
        )
      }

      if (gradeFilter && gradeFilter !== 'all') {
        result = result.filter((file) => file.gradeType === gradeFilter)
      }

      if (categoryFilter && categoryFilter !== 'all') {
        result = result.filter((file) => file.gradeCategory === categoryFilter)
      }

      if (segmentFilter && segmentFilter !== 'all') {
        result = result.filter((file) => file.gradeSegment === segmentFilter)
      }

      if (competitorFilter && competitorFilter !== 'all') {
        result = result.filter((file) => file.userName === competitorFilter)
      }

      // Apply search term
      if (searchTerm) {
        const search = searchTerm.toLowerCase()
        result = result.filter(
          (file) =>
            file.fileName?.toLowerCase().includes(search) ||
            file.originalName?.toLowerCase().includes(search) ||
            file.userName?.toLowerCase().includes(search) ||
            file.competitionName?.toLowerCase().includes(search)
        )
      }

      setFilteredFiles(result)
    }

    applyFilters()
  }, [
    musicFiles,
    searchTerm,
    yearFilter,
    competitionFilter,
    gradeFilter,
    categoryFilter,
    segmentFilter,
    competitorFilter,
  ])

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('')
    setYearFilter('all')
    setCompetitionFilter('all')
    setGradeFilter('all')
    setCategoryFilter('all')
    setSegmentFilter('all')
    setCompetitorFilter('all')
    setSelectedFileIds([])
  }

  // Toggle selection of a file
  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    )
  }

  // Select or deselect all files
  const toggleSelectAll = () => {
    if (selectedFileIds.length === filteredFiles.length) {
      // If all are selected, deselect all
      setSelectedFileIds([])
    } else {
      // Otherwise select all
      setSelectedFileIds(filteredFiles.map((file) => file.$id))
    }
  }

  // Download a single file
  const handleDownload = async (fileId: string, fileName: string) => {
    try {
      const { url } = await getMusicFileDownloadUrl(fileId)

      // Create a hidden anchor element for download
      const link = document.createElement('a')
      link.href = url
      link.download = fileName // Set the filename for download
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast.success('Download started')
    } catch (error) {
      console.error('Error downloading file:', error)
      toast.error('Failed to download file')
    }
  }

  // Download selected files
  const handleBulkDownload = async () => {
    try {
      if (selectedFileIds.length === 0) {
        toast.warning('No files selected for download')
        return
      }

      setIsDownloading(true)
      setDownloadProgress(0)
      setCurrentFileIndex(0)

      // Get selected files
      const selectedFiles = filteredFiles.filter((file) =>
        selectedFileIds.includes(file.$id)
      )

      setTotalFilesToDownload(selectedFiles.length)
      toast.info(`Starting download of ${selectedFiles.length} files...`)

      // Create a hidden anchor element for downloads
      const link = document.createElement('a')
      document.body.appendChild(link)

      // Use recursion to download files one at a time with proper progress tracking
      const downloadNextFile = async (index: number) => {
        if (index >= selectedFiles.length) {
          // All files downloaded
          setIsDownloading(false)
          document.body.removeChild(link)
          toast.success(`Successfully downloaded ${selectedFiles.length} files`)
          return
        }

        const file = selectedFiles[index]
        setCurrentFileIndex(index + 1)
        setDownloadProgress(
          Math.round(((index + 1) / selectedFiles.length) * 100)
        )

        try {
          // Get download URL and trigger download
          const { url } = await getMusicFileDownloadUrl(file.fileId)

          // Set link properties and click it
          link.href = url
          link.download = `${file.fileName}.${file.originalName
            .split('.')
            .pop()}` // Keep the original file extension
          link.click()

          // Wait before downloading the next file
          setTimeout(() => {
            downloadNextFile(index + 1)
          }, 2000) // Longer delay to ensure each download starts
        } catch (error) {
          console.error(`Error downloading file ${file.fileName}:`, error)
          // Continue with next file despite error
          setTimeout(() => {
            downloadNextFile(index + 1)
          }, 1000)
        }
      }

      // Start the download sequence
      downloadNextFile(0)
    } catch (error) {
      console.error('Error in bulk download:', error)
      toast.error('Failed to download files')
      setIsDownloading(false)
    }
  }

  // Delete a file
  const handleDelete = async (fileId: string, musicFileId: string) => {
    try {
      setIsLoading(true)
      await deleteMusicFile(fileId, musicFileId)

      // Update the local state
      setMusicFiles((prev) => prev.filter((file) => file.$id !== musicFileId))
      setFilteredFiles((prev) =>
        prev.filter((file) => file.$id !== musicFileId)
      )
      setSelectedFileIds((prev) => prev.filter((id) => id !== musicFileId))

      toast.success('File deleted successfully')
    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error('Failed to delete file')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-purple-700">
          Music Files Management
        </h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => fetchMusicFiles(true)} // Show success toast on manual refresh
            className="flex items-center gap-1 border-purple-200 hover:bg-purple-50"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </Button>

          <Button
            variant="outline"
            onClick={resetFilters}
            className="flex items-center gap-1 border-purple-200 hover:bg-purple-50"
          >
            <Filter size={16} />
            <span>Reset Filters</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-purple-100 bg-purple-50/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-purple-700">
            Filter Music Files
          </CardTitle>
          <CardDescription>
            Use these filters to narrow down the music files display
          </CardDescription>
        </CardHeader>

        <CardContent>
          {/* Search bar */}
          <div className="mb-6 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <Input
              placeholder="Search by file name, competitor, or competition..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-purple-200 focus-visible:ring-purple-400"
            />
          </div>

          {/* Filter dropdowns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Year filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Year</label>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="border-purple-200 focus:ring-purple-400">
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {years.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Competition filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Competition
              </label>
              <Select
                value={competitionFilter}
                onValueChange={setCompetitionFilter}
              >
                <SelectTrigger className="border-purple-200 focus:ring-purple-400">
                  <SelectValue placeholder="All Competitions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Competitions</SelectItem>
                  {competitions.map((comp) => (
                    <SelectItem key={comp} value={comp}>
                      {comp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Grade</label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="border-purple-200 focus:ring-purple-400">
                  <SelectValue placeholder="All Grades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Grades</SelectItem>
                  {grades.map((grade) => (
                    <SelectItem key={grade} value={grade}>
                      {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Category
              </label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="border-purple-200 focus:ring-purple-400">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Segment filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Segment
              </label>
              <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                <SelectTrigger className="border-purple-200 focus:ring-purple-400">
                  <SelectValue placeholder="All Segments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Segments</SelectItem>
                  {segments.map((segment) => (
                    <SelectItem key={segment} value={segment}>
                      {segment}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Competitor filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Competitor
              </label>
              <Select
                value={competitorFilter}
                onValueChange={setCompetitorFilter}
              >
                <SelectTrigger className="border-purple-200 focus:ring-purple-400">
                  <SelectValue placeholder="All Competitors" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Competitors</SelectItem>
                  {competitors.map((competitor) => (
                    <SelectItem key={competitor} value={competitor}>
                      {competitor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {isLoading ? (
        <LocalLoadingCard message="Loading music files..." minHeight="400px" />
      ) : (
        <Card className="border-purple-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg text-purple-700">
                Music Files
              </CardTitle>
              <CardDescription className="mt-1">
                {filteredFiles.length}{' '}
                {filteredFiles.length === 1 ? 'file' : 'files'}{' '}
                {filteredFiles.length !== musicFiles.length &&
                  `(filtered from ${musicFiles.length})`}
              </CardDescription>
            </div>

            {/* Bulk download button */}
            <Button
              onClick={handleBulkDownload}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
              disabled={selectedFileIds.length === 0 || isDownloading}
            >
              <FileDown size={16} />
              <span>
                {isDownloading
                  ? `Downloading (${currentFileIndex}/${totalFilesToDownload})`
                  : `Download ${
                      selectedFileIds.length > 0
                        ? `(${selectedFileIds.length})`
                        : ''
                    }`}
              </span>
            </Button>
          </CardHeader>

          <CardContent>
            {/* Download progress bar */}
            {isDownloading && (
              <div className="mb-4 space-y-2">
                <Progress value={downloadProgress} className="h-2" />
                <p className="text-sm text-center text-purple-600">
                  Downloading file {currentFileIndex} of {totalFilesToDownload}{' '}
                  ({downloadProgress}%)
                </p>
              </div>
            )}

            <div className="rounded-md border">
              <Table>
                <TableHeader className="bg-purple-50">
                  <TableRow>
                    <TableHead className="w-12 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300"
                        checked={
                          selectedFileIds.length > 0 &&
                          selectedFileIds.length === filteredFiles.length
                        }
                        onChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>File Name</TableHead>
                    <TableHead>Competition</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Competitor</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Uploaded</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiles.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={9}
                        className="text-center py-8 text-gray-500"
                      >
                        {musicFiles.length === 0
                          ? 'No music files found. Upload files via the competitor dashboard.'
                          : 'No files match the current filters.'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFiles.map((file) => (
                      <TableRow
                        key={file.$id}
                        className="hover:bg-purple-50/50"
                      >
                        <TableCell className="text-center">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={selectedFileIds.includes(file.$id)}
                            onChange={() => toggleFileSelection(file.$id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{file.fileName}</span>
                            <span
                              className="text-xs text-gray-500 truncate max-w-40"
                              title={file.originalName}
                            >
                              {file.originalName}
                            </span>
                            <span className="text-xs text-gray-400">
                              {formatFileSize(file.size || 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{file.competitionName}</span>
                            <span className="text-xs text-gray-500">
                              {file.competitionYear}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span>{file.gradeType}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{file.gradeCategory}</span>
                            <span className="text-xs text-gray-500">
                              {file.gradeSegment}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{file.userName}</TableCell>
                        <TableCell>
                          {file.duration
                            ? formatDuration(file.duration)
                            : 'N/A'}
                        </TableCell>
                        <TableCell>
                          <div className="whitespace-nowrap">
                            {file.uploadedAt
                              ? formatDate(file.uploadedAt)
                              : 'N/A'}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                handleDownload(file.fileId, file.originalName)
                              }
                              className="h-8 w-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                              title="Download file"
                            >
                              <Download size={16} />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete file"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Confirm deletion
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this file?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-red-600 hover:bg-red-700"
                                    onClick={() =>
                                      handleDelete(file.fileId, file.$id)
                                    }
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Hidden anchor element for downloads */}
      <a ref={downloadLinkRef} style={{ display: 'none' }} />
    </div>
  )
}

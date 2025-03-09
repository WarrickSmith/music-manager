import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatFileSize, formatDate, formatDuration } from '@/lib/utils'
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
import {
  deleteMusicFile,
  getMusicFileDownloadUrl,
} from '@/app/actions/music-file-actions'
import { useState } from 'react'
import { toast } from 'sonner'
import { Download, Trash2, Loader2 } from 'lucide-react'

type MusicFileProps = {
  id: string
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

interface FileCardProps {
  file: MusicFileProps
  isDeleting?: boolean
  onDeleteStart?: () => void
  onDeleteSuccess?: (fileId: string) => void
}

export default function FileCard({
  file,
  isDeleting = false,
  onDeleteStart,
  onDeleteSuccess,
}: FileCardProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [internalDeleting, setInternalDeleting] = useState(false)

  // Combine external and internal deleting states
  const showDeleteSpinner = isDeleting || internalDeleting

  // Extract fileId from storagePath
  const storagePath = file.storagePath || ''
  const fileId = storagePath.split('/').pop() || ''

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const { url } = await getMusicFileDownloadUrl(fileId)

      // Create a temporary anchor element to trigger download
      const a = document.createElement('a')
      a.href = url
      a.download = file.fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)

      toast.success('Download started')
    } catch (error) {
      toast.error('Failed to download file')
      console.error(error)
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    try {
      // Notify parent component that deletion is starting
      if (onDeleteStart) {
        onDeleteStart()
      }

      // Set internal deleting state as a fallback
      setInternalDeleting(true)

      // Delete the file
      await deleteMusicFile(fileId, file.id)

      toast.success('File deleted successfully')

      // Call the onDeleteSuccess callback with the file ID
      if (onDeleteSuccess) {
        onDeleteSuccess(file.id)
      }
    } catch (error) {
      toast.error('Failed to delete file')
      console.error(error)
      // Reset deleting state if there was an error
      setInternalDeleting(false)
      // Note: we don't need to reset the parent's state because the parent
      // component isn't responsible for monitoring errors in the child
    }
  }

  // If the file is being deleted, show a spinner instead of the card
  if (showDeleteSpinner) {
    return (
      <div className="flex items-center justify-center h-full min-h-[240px] bg-sky-50 rounded-lg border border-sky-100 animate-pulse">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-10 w-10 text-sky-500 animate-spin" />
          <span className="text-sm text-sky-500 font-medium">Deleting...</span>
        </div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{file.fileName}</CardTitle>
        <CardDescription>Original: {file.originalName}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <p className="font-semibold">Competition:</p>
            <p>
              {file.competitionYear} {file.competitionName}
            </p>
          </div>
          <div>
            <p className="font-semibold">Grade:</p>
            <p>
              {file.gradeType} ({file.gradeCategory} - {file.gradeSegment})
            </p>
          </div>
          <div>
            <p className="font-semibold">Uploaded:</p>
            <p>{formatDate(file.uploadedAt)}</p>
          </div>
          <div>
            <p className="font-semibold">Size:</p>
            <p>{formatFileSize(file.size)}</p>
          </div>
          <div>
            <p className="font-semibold">Duration:</p>
            <p>{file.duration ? formatDuration(file.duration) : 'Unknown'}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={handleDownload}
          className="cursor-pointer"
          size="icon"
          title="Download"
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="cursor-pointer"
              size="icon"
              title="Delete"
              disabled={showDeleteSpinner}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                music file from the system.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 cursor-pointer"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}

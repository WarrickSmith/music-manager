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
import LoadingOverlay from '@/components/ui/loading-overlay'
import { Download, Trash2 } from 'lucide-react'

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
  onDeleteSuccess?: () => void
}

export default function FileCard({ file, onDeleteSuccess }: FileCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Extract fileId from storagePath
  const storagePath = file.storagePath || ''
  const fileId = storagePath.split('/').pop() || ''

  const handleDownload = async () => {
    try {
      setIsLoading(true)
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
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsLoading(true)
      await deleteMusicFile(fileId, file.id)
      toast.success('File deleted successfully')

      // Call the onDeleteSuccess callback to refresh the parent component
      if (onDeleteSuccess) {
        onDeleteSuccess()
      }
    } catch (error) {
      toast.error('Failed to delete file')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="relative">
      {isLoading && <LoadingOverlay message="Processing..." />}

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
        >
          <Download className="h-4 w-4" />
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="destructive"
              className="cursor-pointer"
              size="icon"
              title="Delete"
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

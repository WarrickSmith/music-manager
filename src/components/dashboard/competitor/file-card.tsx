import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { formatFileSize, formatDate } from '@/lib/utils'
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
}

export default function FileCard({ file }: { file: MusicFileProps }) {
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
        </div>
      </CardContent>

      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleDownload}>
          Download
        </Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive">Delete</Button>
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
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}

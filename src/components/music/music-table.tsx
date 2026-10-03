'use client'

import { Download, Loader2, Lock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AudioPlayerButton from '@/components/ui/audio-player-button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDate, formatDuration, formatFileSize, cn } from '@/lib/utils'
import { gradeChipClass } from '@/lib/grade-tone'
import DeleteFileDialog from './delete-file-dialog'
import { storageFileId, type MusicFile } from './types'

/** Dense list view of music files, the same columns for both roles */
export default function MusicTable({
  files,
  showCompetitor,
  selectedIds,
  onToggle,
  onToggleAll,
  isLocked,
  deletingIds,
  downloadingIds,
  onDelete,
  onDownload,
}: {
  files: MusicFile[]
  showCompetitor: boolean
  /** Present only when rows can be selected (admins) */
  selectedIds?: string[]
  onToggle?: (id: string) => void
  onToggleAll?: () => void
  /** True when a competitor can no longer delete this file (deadline passed) */
  isLocked: (file: MusicFile) => boolean
  deletingIds: string[]
  downloadingIds: string[]
  onDelete: (file: MusicFile) => void
  onDownload: (file: MusicFile) => void
}) {
  const selectable = !!selectedIds && !!onToggle && !!onToggleAll
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {selectable && (
            <TableHead className="w-10">
              <input
                type="checkbox"
                aria-label="Select all files"
                className="size-4 accent-[var(--primary)]"
                checked={
                  selectedIds.length > 0 && selectedIds.length === files.length
                }
                onChange={onToggleAll}
              />
            </TableHead>
          )}
          <TableHead>Grade</TableHead>
          <TableHead>Programme</TableHead>
          <TableHead>Competition</TableHead>
          {showCompetitor && <TableHead>Competitor</TableHead>}
          <TableHead>Length</TableHead>
          <TableHead>Uploaded / size</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => {
          const deleting = deletingIds.includes(file.$id)
          return (
            <TableRow
              key={file.$id}
              className={cn(deleting && 'opacity-50')}
              data-state={
                selectedIds?.includes(file.$id) ? 'selected' : undefined
              }
            >
              {selectable && (
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Select ${file.gradeCategory} ${file.gradeSegment}`}
                    className="size-4 accent-[var(--primary)]"
                    checked={selectedIds.includes(file.$id)}
                    onChange={() => onToggle(file.$id)}
                  />
                </TableCell>
              )}
              <TableCell>
                <span
                  className={cn(
                    'rounded-sm px-2 py-0.5 text-[13px] font-bold',
                    gradeChipClass(file.gradeType)
                  )}
                >
                  {file.gradeType}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold">{file.gradeCategory}</span>
                  <span className="text-sm">{file.gradeSegment}</span>
                  <span
                    className="max-w-48 truncate font-mono text-xs text-muted-foreground"
                    title={file.originalName}
                  >
                    {file.originalName}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {file.competitionYear} {file.competitionName}
              </TableCell>
              {showCompetitor && <TableCell>{file.userName}</TableCell>}
              <TableCell className="font-mono tabular-nums">
                {file.duration ? formatDuration(file.duration) : '--:--'}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums">
                {file.uploadedAt ? formatDate(file.uploadedAt) : 'N/A'}
                <span className="block text-muted-foreground">
                  {formatFileSize(file.size || 0)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1.5">
                  <AudioPlayerButton
                    fileId={storageFileId(file)}
                    title={`${file.gradeCategory} · ${file.gradeSegment}`}
                    subtitle={`${file.userName} · ${file.competitionYear} ${file.competitionName}`}
                    size="icon"
                    className="size-8"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="size-8"
                    onClick={() => onDownload(file)}
                    disabled={downloadingIds.includes(file.$id)}
                    title="Download"
                    aria-label="Download"
                  >
                    {downloadingIds.includes(file.$id) ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Download />
                    )}
                  </Button>
                  {isLocked(file) ? (
                    <Button
                      variant="outline"
                      size="icon"
                      className="size-8"
                      disabled
                      title="Locked after the upload deadline"
                      aria-label="Locked after the upload deadline"
                    >
                      <Lock />
                    </Button>
                  ) : (
                    <DeleteFileDialog
                      file={file}
                      onConfirm={() => onDelete(file)}
                    >
                      <Button
                        variant="outline"
                        size="icon"
                        className="size-8 hover:text-destructive"
                        disabled={deleting}
                        title="Delete"
                        aria-label="Delete"
                      >
                        <Trash2 />
                      </Button>
                    </DeleteFileDialog>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

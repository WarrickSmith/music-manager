'use client'

import { Download, Loader2, Lock, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import AudioPlayerButton from '@/components/ui/audio-player-button'
import { formatDate, formatDuration, formatFileSize, cn } from '@/lib/utils'
import { gradeChipClass } from '@/lib/grade-tone'
import DeleteFileDialog from './delete-file-dialog'
import { storageFileId, type MusicFile } from './types'

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

/**
 * Compact music file card used on both the competitor and admin screens.
 * One header row (grade, segment, length), the title, one details line and a
 * slim action strip. Admins additionally see who the file belongs to.
 */
export default function MusicCard({
  file,
  showCompetitor,
  selected,
  onSelectChange,
  locked = false,
  isDeleting,
  isDownloading,
  onDelete,
  onDownload,
}: {
  file: MusicFile
  showCompetitor: boolean
  selected?: boolean
  onSelectChange?: (selected: boolean) => void
  /** The competition's upload deadline has passed, so a competitor cannot delete this */
  locked?: boolean
  isDeleting: boolean
  isDownloading: boolean
  onDelete: (file: MusicFile) => void
  onDownload: (file: MusicFile) => void
}) {
  if (isDeleting) {
    return (
      <div
        className="flex min-h-[170px] animate-pulse flex-col items-center justify-center gap-2 rounded-lg border bg-card text-muted-foreground"
        role="status"
      >
        <Loader2 className="size-7 animate-spin text-primary" />
        <span className="text-sm font-medium">Deleting...</span>
      </div>
    )
  }

  return (
    <article
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border bg-card transition-colors hover:border-muted-foreground/60',
        selected && 'border-primary'
      )}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 px-4 pt-3">
        {onSelectChange && (
          <input
            type="checkbox"
            checked={!!selected}
            onChange={(e) => onSelectChange(e.target.checked)}
            aria-label={`Select ${file.gradeCategory} ${file.gradeSegment}`}
            className="size-4 accent-[var(--primary)]"
          />
        )}
        <span
          className={cn(
            'rounded-sm px-2 py-0.5 text-[13px] font-bold whitespace-nowrap',
            gradeChipClass(file.gradeType)
          )}
        >
          {file.gradeType}
        </span>
        <span className="rounded-sm border px-2 py-0.5 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
          {file.gradeSegment}
        </span>
        <span className="ml-auto font-mono text-[15px] tabular-nums">
          {file.duration ? formatDuration(file.duration) : '--:--'}
        </span>
      </div>

      <div className="min-w-0 px-4 pt-2.5">
        <h3 className="font-display text-[17px] leading-snug font-bold break-words">
          {file.gradeCategory}
        </h3>
        <p
          className="truncate font-mono text-xs text-muted-foreground"
          title={file.originalName}
        >
          {file.originalName}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 pt-2 pb-3 text-[13.5px] text-muted-foreground">
        {showCompetitor && (
          <span className="inline-flex items-center gap-2 font-medium text-foreground">
            <span className="grid size-5 place-items-center rounded-sm bg-accent font-display text-[9px] font-bold text-accent-foreground">
              {initials(file.userName)}
            </span>
            {file.userName}
          </span>
        )}
        <span className="font-medium text-foreground">
          {file.competitionYear} {file.competitionName}
        </span>
        {locked && (
          <span
            className="inline-flex items-center gap-1 rounded-sm bg-secondary px-1.5 py-0.5 text-[11px] font-semibold text-muted-foreground"
            title="The upload deadline has passed, so this file is locked"
          >
            <Lock className="size-3" aria-hidden /> Locked
          </span>
        )}
        <span className="tabular-nums">
          {file.uploadedAt ? formatDate(file.uploadedAt) : 'N/A'} ·{' '}
          {formatFileSize(file.size || 0)}
        </span>
      </div>

      <div className="mt-auto grid grid-cols-[1fr_46px_46px] gap-px border-t bg-border">
        <AudioPlayerButton
          fileId={storageFileId(file)}
          title={`${file.gradeCategory} · ${file.gradeSegment}`}
          subtitle={`${file.userName} · ${file.competitionYear} ${file.competitionName}`}
          size="default"
          showLabel
          className="h-10 rounded-none"
        />
        <Button
          variant="secondary"
          className="h-10 rounded-none"
          onClick={() => onDownload(file)}
          disabled={isDownloading}
          title="Download"
          aria-label="Download"
        >
          {isDownloading ? <Loader2 className="animate-spin" /> : <Download />}
        </Button>
        {locked ? (
          <Button
            variant="secondary"
            className="h-10 rounded-none"
            disabled
            title="Locked after the upload deadline"
            aria-label="Locked after the upload deadline"
          >
            <Lock />
          </Button>
        ) : (
          <DeleteFileDialog file={file} onConfirm={() => onDelete(file)}>
            <Button
              variant="secondary"
              className="h-10 rounded-none hover:text-destructive"
              title="Delete"
              aria-label="Delete"
            >
              <Trash2 />
            </Button>
          </DeleteFileDialog>
        )}
      </div>
    </article>
  )
}

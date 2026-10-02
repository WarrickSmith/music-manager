'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { FileDown, LayoutGrid, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import ErrorNotice from '@/components/ui/error-notice'
import {
  deleteMusicFile,
  getMusicFileDownloadUrl,
} from '@/app/actions/music-file-actions'
import { formatDuration, cn } from '@/lib/utils'
import { isPastDeadline } from '@/lib/deadline'
import MusicFilterBar from './music-filter-bar'
import MusicCard from './music-card'
import MusicTable from './music-table'
import { useMusicFilters } from './use-music-filters'
import { storageFileId, type MusicFile } from './types'

type View = 'cards' | 'list'
const VIEW_KEY = 'mm-music-view'

interface ActionError {
  title: string
  message: string
  details?: string
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function describe(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

/**
 * The music file browser used by both roles: filters, a results line, and
 * either compact cards or a dense list. Admins also get row selection and a
 * bulk download. Everything else is identical for both roles.
 */
export default function MusicFilesView({
  files,
  isAdmin,
  emptyMessage,
  onFileDeleted,
  deadlines,
}: {
  files: MusicFile[]
  isAdmin: boolean
  emptyMessage: string
  onFileDeleted: (id: string) => void
  /** Upload deadline per competition ID. Competitors cannot delete after it. */
  deadlines?: Record<string, string>
}) {
  const isLocked = (file: MusicFile) =>
    !isAdmin && isPastDeadline(deadlines?.[file.competitionId])
  const { filters, setFilter, reset, options, filtered, isFiltered } =
    useMusicFilters(files)
  const [view, setView] = useState<View>('cards')
  const [deletingIds, setDeletingIds] = useState<string[]>([])
  const [downloadingIds, setDownloadingIds] = useState<string[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [bulk, setBulk] = useState<{ index: number; total: number } | null>(
    null,
  )
  const [actionError, setActionError] = useState<ActionError | null>(null)

  // Remember the chosen view between visits; fall back quietly if storage is blocked
  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_KEY)
      if (saved === 'cards' || saved === 'list') setView(saved)
    } catch {}
  }, [])

  const changeView = (next: View) => {
    setView(next)
    try {
      localStorage.setItem(VIEW_KEY, next)
    } catch {}
  }

  const triggerDownload = (url: string, name: string) => {
    const link = document.createElement('a')
    link.href = url
    link.download = name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleDownload = async (file: MusicFile) => {
    setActionError(null)
    setDownloadingIds((prev) => [...prev, file.$id])
    try {
      const { url } = await getMusicFileDownloadUrl(storageFileId(file))
      triggerDownload(url, file.originalName || file.fileName)
      toast.success('Download started')
    } catch (error) {
      console.error('Error downloading file:', error)
      setActionError({
        title: 'Could not download the file',
        message: `${file.gradeCategory} ${file.gradeSegment} could not be downloaded. Try again in a moment.`,
        details: describe(error),
      })
    } finally {
      setDownloadingIds((prev) => prev.filter((id) => id !== file.$id))
    }
  }

  const handleDelete = async (file: MusicFile) => {
    setActionError(null)
    setDeletingIds((prev) => [...prev, file.$id])
    try {
      const result = await deleteMusicFile(storageFileId(file), file.$id)
      if (!result.success) {
        setActionError({
          title: 'This file is locked',
          message: result.error,
        })
        return
      }
      onFileDeleted(file.$id)
      setSelectedIds((prev) => prev.filter((id) => id !== file.$id))
      toast.success('File deleted')
    } catch (error) {
      console.error('Error deleting file:', error)
      setActionError({
        title: 'Could not delete the file',
        message: `${file.gradeCategory} ${file.gradeSegment} was not deleted. Nothing has been removed.`,
        details: describe(error),
      })
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== file.$id))
    }
  }

  const handleBulkDownload = async () => {
    const chosen = filtered.filter((f) => selectedIds.includes(f.$id))
    if (chosen.length === 0) return
    setActionError(null)
    const failed: string[] = []
    for (let i = 0; i < chosen.length; i++) {
      setBulk({ index: i + 1, total: chosen.length })
      const file = chosen[i]
      try {
        const { url } = await getMusicFileDownloadUrl(storageFileId(file))
        const ext = file.originalName?.split('.').pop()
        triggerDownload(url, ext ? `${file.fileName}.${ext}` : file.fileName)
      } catch (error) {
        console.error(`Error downloading ${file.fileName}:`, error)
        failed.push(`${file.fileName}: ${describe(error)}`)
      }
      // Browsers need a gap between automatic downloads
      await wait(1500)
    }
    setBulk(null)
    if (failed.length) {
      setActionError({
        title: `${failed.length} of ${chosen.length} downloads failed`,
        message: 'The other files were downloaded. Try the failed ones again.',
        details: failed.join('\n'),
      })
    } else {
      toast.success(`Downloaded ${chosen.length} files`)
    }
  }

  const toggleOne = (id: string) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  const toggleAll = () =>
    setSelectedIds(
      selectedIds.length === filtered.length ? [] : filtered.map((f) => f.$id),
    )

  const totalSeconds = filtered.reduce((sum, f) => sum + (f.duration || 0), 0)

  return (
    <div className="flex flex-col gap-4">
      <MusicFilterBar
        filters={filters}
        options={options}
        onChange={setFilter}
        showCompetitor={isAdmin}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <p aria-live="polite">
          <b className="font-semibold text-foreground">{filtered.length}</b> of{' '}
          {files.length} {files.length === 1 ? 'file' : 'files'}
          {totalSeconds > 0 && ` · ${formatDuration(totalSeconds)} total`}
          {isFiltered && (
            <button
              type="button"
              onClick={reset}
              className="ml-3 font-semibold text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </p>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              size="sm"
              onClick={handleBulkDownload}
              disabled={selectedIds.length === 0 || !!bulk}
            >
              <FileDown />
              {bulk
                ? `Downloading ${bulk.index} of ${bulk.total}`
                : selectedIds.length > 0
                  ? `Download selected (${selectedIds.length})`
                  : 'Download selected'}
            </Button>
          )}
          <div
            className="flex overflow-hidden rounded-md border"
            role="group"
            aria-label="View"
          >
            {(
              [
                ['cards', 'Cards', LayoutGrid],
                ['list', 'List', List],
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                type="button"
                onClick={() => changeView(value)}
                aria-pressed={view === value}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-medium transition-colors',
                  value === 'list' && 'border-l',
                  view === value
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-card hover:bg-secondary',
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {bulk && (
        <Progress
          value={Math.round((bulk.index / bulk.total) * 100)}
          aria-label="Bulk download progress"
        />
      )}

      {actionError && <ErrorNotice {...actionError} />}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-muted-foreground">
          {files.length === 0
            ? emptyMessage
            : 'No music files match these filters. Clear a filter to see more.'}
        </div>
      ) : view === 'cards' ? (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((file) => (
            <MusicCard
              key={file.$id}
              file={file}
              showCompetitor={isAdmin}
              selected={isAdmin ? selectedIds.includes(file.$id) : undefined}
              onSelectChange={isAdmin ? () => toggleOne(file.$id) : undefined}
              locked={isLocked(file)}
              isDeleting={deletingIds.includes(file.$id)}
              isDownloading={downloadingIds.includes(file.$id)}
              onDelete={handleDelete}
              onDownload={handleDownload}
            />
          ))}
        </div>
      ) : (
        <MusicTable
          files={filtered}
          showCompetitor={isAdmin}
          selectedIds={isAdmin ? selectedIds : undefined}
          onToggle={isAdmin ? toggleOne : undefined}
          onToggleAll={isAdmin ? toggleAll : undefined}
          isLocked={isLocked}
          deletingIds={deletingIds}
          downloadingIds={downloadingIds}
          onDelete={handleDelete}
          onDownload={handleDownload}
        />
      )}
    </div>
  )
}

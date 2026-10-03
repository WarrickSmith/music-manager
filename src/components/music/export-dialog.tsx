'use client'

import { useEffect, useMemo, useState } from 'react'
import { FileArchive } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ErrorNotice from '@/components/ui/error-notice'
import { formatFileSize } from '@/lib/utils'
import type { ExportOrder } from '@/lib/music/export-plan'
import type { MusicFile } from './types'

interface Preflight {
  count: number
  bytes: number
  filename: string
}

/**
 * Download one competition's music as a zip, numbered in running order with a
 * manifest.csv. The server checks the request first so any problem shows here
 * instead of as a broken download.
 */
export default function ExportDialog({ files }: { files: MusicFile[] }) {
  const [open, setOpen] = useState(false)
  const [competitionId, setCompetitionId] = useState('')
  const [order, setOrder] = useState<ExportOrder>('grade')
  const [preflight, setPreflight] = useState<Preflight | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [checkedKey, setCheckedKey] = useState('')

  const competitions = useMemo(() => {
    const map = new Map<
      string,
      { id: string; label: string; count: number; year: number }
    >()
    for (const f of files) {
      const entry = map.get(f.competitionId) ?? {
        id: f.competitionId,
        label: `${f.competitionYear} ${f.competitionName}`,
        count: 0,
        year: f.competitionYear,
      }
      entry.count++
      map.set(f.competitionId, entry)
    }
    return [...map.values()].sort(
      (a, b) => b.year - a.year || a.label.localeCompare(b.label)
    )
  }, [files])

  // Pick the first competition when the dialog opens
  const chosen = competitionId || competitions[0]?.id || ''
  const key = `${chosen}|${order}`
  const url = `/api/music/export?competitionId=${encodeURIComponent(chosen)}&order=${order}`

  // Ask the server what the zip will contain, and surface any problem now
  useEffect(() => {
    if (!open || !chosen) return
    let cancelled = false
    const check = async () => {
      try {
        const response = await fetch(`${url}&preflight=1`)
        const body = await response.json()
        if (cancelled) return
        if (!response.ok) {
          setPreflight(null)
          setError(body.error ?? `The server returned ${response.status}.`)
        } else {
          setPreflight(body)
          setError(null)
        }
      } catch (err) {
        if (cancelled) return
        setPreflight(null)
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        if (!cancelled) setCheckedKey(key)
      }
    }
    check()
    return () => {
      cancelled = true
    }
  }, [open, chosen, url, key])

  const checking = checkedKey !== key

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileArchive /> Export zip
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Export music for the rink
          </DialogTitle>
          <DialogDescription>
            Download every file for one competition in one zip. Files are
            numbered in running order, and a manifest.csv lists the order,
            skaters, lengths and sizes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="export-competition" className="label-mono">
            Competition
          </Label>
          <Select value={chosen} onValueChange={setCompetitionId}>
            <SelectTrigger id="export-competition">
              <SelectValue placeholder="Choose a competition" />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.label} ({c.count} {c.count === 1 ? 'file' : 'files'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="label-mono">Running order</Label>
          <RadioGroup
            value={order}
            onValueChange={(v) => setOrder(v as ExportOrder)}
            className="space-y-2"
          >
            <div className="flex items-start gap-2">
              <RadioGroupItem value="grade" id="order-grade" className="mt-1" />
              <Label htmlFor="order-grade" className="font-normal">
                <span className="font-semibold">By grade.</span> Each grade
                together: short or rhythm part, then free part.
              </Label>
            </div>
            <div className="flex items-start gap-2">
              <RadioGroupItem
                value="segment"
                id="order-segment"
                className="mt-1"
              />
              <Label htmlFor="order-segment" className="font-normal">
                <span className="font-semibold">By segment.</span> All short
                programs first, then all free skates.
              </Label>
            </div>
          </RadioGroup>
        </div>

        <p className="text-sm text-muted-foreground" aria-live="polite">
          {checking
            ? 'Checking...'
            : preflight
              ? `${preflight.count} ${preflight.count === 1 ? 'file' : 'files'}, about ${formatFileSize(preflight.bytes)}. Saved as ${preflight.filename}.`
              : ''}
        </p>

        {error && !checking && (
          <ErrorNotice title="Cannot export yet" message={error} />
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          <Button asChild disabled={checking || !preflight}>
            <a
              href={checking || !preflight ? undefined : url}
              download
              aria-disabled={checking || !preflight}
              onClick={() =>
                toast.info(
                  'Preparing the zip. Large events can take a minute before the download starts.'
                )
              }
            >
              <FileArchive /> Download zip
            </a>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

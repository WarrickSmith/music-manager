'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import ErrorNotice from '@/components/ui/error-notice'
import { updateCompetitionDeadline } from '@/app/actions/competition-actions'
import {
  deadlineStatus,
  fromDatetimeLocalValue,
  toDatetimeLocalValue,
} from '@/lib/deadline'

/**
 * Set or clear the time after which competitors can no longer upload, replace
 * or delete their music for one competition. Admins are never locked out.
 */
export default function DeadlineDialog({
  competitionId,
  competitionName,
  current,
  open,
  onOpenChange,
  onSaved,
}: {
  competitionId: string
  competitionName: string
  current: string | null | undefined
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (uploadDeadline: string | null) => void
}) {
  const [value, setValue] = useState(toDatetimeLocalValue(current))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Start from the saved deadline each time the dialog opens
  useEffect(() => {
    if (open) {
      setValue(toDatetimeLocalValue(current))
      setError(null)
    }
  }, [open, current])

  const save = async (next: string | null) => {
    setSaving(true)
    setError(null)
    try {
      const result = await updateCompetitionDeadline(competitionId, next)
      if (!result.ok) {
        setError(result.error)
        return
      }
      toast.success(next ? 'Deadline saved' : 'Deadline removed')
      onSaved(result.data.uploadDeadline)
      onOpenChange(false)
    } catch (err) {
      console.error('Could not save the deadline:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  const preview = deadlineStatus(fromDatetimeLocalValue(value))

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Upload deadline
          </DialogTitle>
          <DialogDescription>
            After this time, competitors can no longer upload, replace or delete
            music for {competitionName}. Admins can always make changes.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="deadline-input" className="label-mono">
            Closes at (your local time)
          </Label>
          <Input
            id="deadline-input"
            type="datetime-local"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={saving}
          />
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {preview.state === 'none' ? 'No deadline set.' : preview.label}
          </p>
        </div>

        {error && (
          <ErrorNotice title="Could not save the deadline" message={error} />
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => save(null)}
            disabled={saving || !current}
          >
            Remove deadline
          </Button>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => save(fromDatetimeLocalValue(value))}
              disabled={saving || !value}
            >
              {saving ? 'Saving...' : 'Save deadline'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

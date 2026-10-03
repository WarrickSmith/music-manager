'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ErrorNotice from '@/components/ui/error-notice'
import { addEntries, type CompetitorOption } from '@/app/actions/entry-actions'
import type { Entry, GradeInfo } from '@/lib/music/entries'
import { compareGrades } from '@/lib/music/grade-order'

const asLike = (g: GradeInfo) => ({
  gradeType: g.name,
  gradeCategory: g.category,
  gradeSegment: g.segment,
})

/** Enter one skater in one or more grades of a competition */
export default function AddEntriesDialog({
  open,
  onOpenChange,
  competitionId,
  competitionLabel,
  grades,
  competitors,
  entries,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  competitionId: string
  competitionLabel: string
  grades: GradeInfo[]
  competitors: CompetitorOption[]
  entries: Entry[]
  onAdded: () => void
}) {
  const [userId, setUserId] = useState('')
  const [picked, setPicked] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const alreadyEntered = useMemo(
    () =>
      new Set(entries.filter((e) => e.userId === userId).map((e) => e.gradeId)),
    [entries, userId]
  )

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return [...grades]
      .sort((a, b) => compareGrades(asLike(a), asLike(b)))
      .filter(
        (g) =>
          !q || `${g.name} ${g.category} ${g.segment}`.toLowerCase().includes(q)
      )
  }, [grades, search])

  const toggle = (id: string) =>
    setPicked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )

  const submit = async () => {
    const competitor = competitors.find((c) => c.id === userId)
    if (!competitor) return
    setSaving(true)
    setError(null)
    try {
      const result = await addEntries({
        competitionId,
        userId: competitor.id,
        userName: competitor.name,
        gradeIds: picked,
      })
      if (!result.ok) {
        setError(result.error)
        return
      }
      const { added, skipped } = result.data
      toast.success(
        `${competitor.name} entered in ${added} ${added === 1 ? 'grade' : 'grades'}` +
          (skipped ? ` (${skipped} already entered)` : '')
      )
      setPicked([])
      onAdded()
      onOpenChange(false)
    } catch (err) {
      console.error('Could not add entries:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  let lastGroup = ''
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-display text-xl font-bold">
            Add entries
          </DialogTitle>
          <DialogDescription>
            Enter a skater in the grades they are skating at {competitionLabel}.
            Their music then shows as missing until they upload it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="entry-skater" className="label-mono">
            Skater
          </Label>
          <Select
            value={userId}
            onValueChange={(v) => {
              setUserId(v)
              setPicked([])
            }}
          >
            <SelectTrigger id="entry-skater">
              <SelectValue
                placeholder={
                  competitors.length === 0
                    ? 'No competitor accounts yet'
                    : 'Choose a skater'
                }
              />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {competitors.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name} ({c.email})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry-search" className="label-mono">
            Grades ({picked.length} selected)
          </Label>
          <div className="relative">
            <Search
              className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              id="entry-search"
              placeholder="Search grades, e.g. novice free"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              disabled={!userId}
            />
          </div>
          <div className="max-h-64 overflow-y-auto rounded-md border bg-background">
            {!userId ? (
              <p className="p-4 text-sm text-muted-foreground">
                Choose a skater first.
              </p>
            ) : visible.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                No grades match.
              </p>
            ) : (
              visible.map((grade) => {
                const heading = `${grade.name} · ${grade.category}`
                const showHeading = heading !== lastGroup
                lastGroup = heading
                const entered = alreadyEntered.has(grade.$id)
                return (
                  <div key={grade.$id}>
                    {showHeading && (
                      <p className="label-mono bg-muted px-3 py-1.5">
                        {heading}
                      </p>
                    )}
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-secondary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                      <input
                        type="checkbox"
                        className="size-4 accent-[var(--primary)]"
                        checked={entered || picked.includes(grade.$id)}
                        disabled={entered}
                        onChange={() => toggle(grade.$id)}
                      />
                      <span className="flex-1">{grade.segment}</span>
                      {entered && (
                        <span className="text-xs text-muted-foreground">
                          Already entered
                        </span>
                      )}
                    </label>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {error && (
          <ErrorNotice title="Could not add the entries" message={error} />
        )}

        <DialogFooter>
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
            onClick={submit}
            disabled={saving || !userId || picked.length === 0}
          >
            {saving
              ? 'Adding...'
              : `Add ${picked.length || ''} ${picked.length === 1 ? 'entry' : 'entries'}`.replace(
                  /\s+/g,
                  ' '
                )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

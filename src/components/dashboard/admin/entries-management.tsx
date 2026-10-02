'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  CircleAlert,
  ClipboardCopy,
  Plus,
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { getCompetitions } from '@/app/actions/competition-actions'
import {
  getEntryOverview,
  listCompetitors,
  removeEntry,
  type CompetitorOption,
  type EntryOverview,
} from '@/app/actions/entry-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import ErrorNotice from '@/components/ui/error-notice'
import LocalLoadingCard from '@/components/ui/local-loading-card'
import PageHeader from '@/components/layout/page-header'
import { copyText } from '@/lib/error-report'
import { gradeChipClass } from '@/lib/grade-tone'
import {
  groupByGrade,
  matchEntries,
  missingListText,
  summarise,
} from '@/lib/music/entries'
import { cn, formatDate, formatDuration } from '@/lib/utils'
import AddEntriesDialog from './add-entries-dialog'

interface CompetitionOption {
  $id: string
  name: string
  year: number
  active: boolean
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'ok' | 'warn'
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card px-4 py-3',
        tone === 'warn' && 'border-warning/60',
      )}
    >
      <p className="font-display text-2xl leading-tight font-bold tabular-nums">
        {value}
      </p>
      <p className="label-mono">{label}</p>
    </div>
  )
}

/**
 * Enter skaters in grades and see whose music is still missing. A skater's
 * music counts as received when they have uploaded a file for that grade.
 */
export default function EntriesManagement() {
  const [competitions, setCompetitions] = useState<CompetitionOption[]>([])
  const [competitionId, setCompetitionId] = useState('')
  const [overview, setOverview] = useState<EntryOverview | null>(null)
  const [competitors, setCompetitors] = useState<CompetitorOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [missingOnly, setMissingOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [removing, setRemoving] = useState<string | null>(null)

  const loadOverview = useCallback(async (id: string) => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const result = await getEntryOverview(id)
      if (!result.ok) {
        setOverview(null)
        setError(result.error)
      } else {
        setOverview(result.data)
      }
    } catch (err) {
      console.error('Could not load entries:', err)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  // Load the competitions and competitor accounts once
  useEffect(() => {
    const init = async () => {
      try {
        const [list, people] = await Promise.all([
          getCompetitions(),
          listCompetitors(),
        ])
        const rows = list as unknown as CompetitionOption[]
        setCompetitions(rows)
        if (people.ok) setCompetitors(people.data)
        const first = rows.find((c) => c.active) ?? rows[0]
        if (first) setCompetitionId(first.$id)
        else setLoading(false)
      } catch (err) {
        console.error('Could not load competitions:', err)
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    if (competitionId) loadOverview(competitionId)
  }, [competitionId, loadOverview])

  const competition = competitions.find((c) => c.$id === competitionId)
  const competitionLabel = competition
    ? `${competition.year} ${competition.name}`
    : ''

  const statuses = useMemo(
    () =>
      overview
        ? matchEntries(overview.entries, overview.grades, overview.files)
        : [],
    [overview],
  )
  const summary = summarise(statuses)

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase()
    const shown = statuses.filter(
      (s) =>
        (!missingOnly || !s.received) &&
        (!q ||
          s.entry.userName.toLowerCase().includes(q) ||
          `${s.grade?.name} ${s.grade?.category} ${s.grade?.segment}`
            .toLowerCase()
            .includes(q)),
    )
    return groupByGrade(shown)
  }, [statuses, missingOnly, search])

  const copyMissing = async () => {
    const ok = await copyText(missingListText(statuses, competitionLabel))
    if (ok) toast.success('Missing list copied')
    else toast.error('Could not copy. Select the text and copy it by hand.')
  }

  const remove = async (entryId: string) => {
    setRemoving(entryId)
    try {
      const result = await removeEntry(entryId)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      setOverview((prev) =>
        prev
          ? { ...prev, entries: prev.entries.filter((e) => e.$id !== entryId) }
          : prev,
      )
    } finally {
      setRemoving(null)
    }
  }

  const percent =
    summary.total > 0 ? Math.round((summary.received / summary.total) * 100) : 0

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Entries"
        description="Enter skaters in their grades to see whose music is still missing. Music counts as received once the skater uploads a file for that grade."
        actions={
          <>
            <Button
              variant="outline"
              onClick={copyMissing}
              disabled={!overview || summary.missing === 0}
            >
              <ClipboardCopy /> Copy missing list
            </Button>
            <Button onClick={() => setAddOpen(true)} disabled={!overview}>
              <Plus /> Add entries
            </Button>
          </>
        }
      />

      {competitions.length > 0 && (
        <div className="max-w-md">
          <Select value={competitionId} onValueChange={setCompetitionId}>
            <SelectTrigger aria-label="Competition">
              <SelectValue placeholder="Choose a competition" />
            </SelectTrigger>
            <SelectContent>
              {competitions.map((c) => (
                <SelectItem key={c.$id} value={c.$id}>
                  {c.year} {c.name}
                  {!c.active && ' (inactive)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {loading ? (
        <LocalLoadingCard message="Loading entries..." minHeight="240px" />
      ) : error ? (
        <ErrorNotice
          title="Could not load the entries"
          message={error}
          onRetry={() => loadOverview(competitionId)}
        />
      ) : competitions.length === 0 ? (
        <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-muted-foreground">
          Create a competition first, then enter skaters in its grades here.
        </div>
      ) : overview ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Entries" value={String(summary.total)} />
            <Stat
              label="Music received"
              value={String(summary.received)}
              tone="ok"
            />
            <Stat
              label="Still missing"
              value={String(summary.missing)}
              tone={summary.missing > 0 ? 'warn' : undefined}
            />
            <Stat label="Complete" value={`${percent}%`} />
          </div>

          <div
            className="h-2 overflow-hidden rounded-sm bg-secondary"
            role="progressbar"
            aria-label="Music received"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={percent}
          >
            <div
              className="h-full bg-success"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
              <Search
                className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                aria-label="Search entries"
                placeholder="Search skater or grade"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                className="size-4 accent-[var(--primary)]"
                checked={missingOnly}
                onChange={(e) => setMissingOnly(e.target.checked)}
              />
              Show missing music only
            </label>
          </div>

          {summary.total === 0 ? (
            <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-muted-foreground">
              No skaters are entered in {competitionLabel} yet. Use Add entries
              to enter a skater in their grades.
            </div>
          ) : groups.length === 0 ? (
            <div className="rounded-lg border border-dashed bg-card px-6 py-10 text-center text-muted-foreground">
              {missingOnly && !search
                ? 'Nothing is missing. Every entered skater has uploaded their music.'
                : 'No entries match.'}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {groups.map((group) => {
                const missing = group.items.filter((i) => !i.received).length
                return (
                  <section
                    key={group.gradeId}
                    className="overflow-hidden rounded-lg border bg-card"
                  >
                    <header className="flex flex-wrap items-center gap-2 border-b bg-muted px-4 py-2.5">
                      {group.grade && (
                        <span
                          className={cn(
                            'rounded-sm px-2 py-0.5 text-[13px] font-bold whitespace-nowrap',
                            gradeChipClass(group.grade.name),
                          )}
                        >
                          {group.grade.name}
                        </span>
                      )}
                      <h3 className="font-display text-base font-bold">
                        {group.grade?.category ?? 'Unknown grade'}
                      </h3>
                      <span className="rounded-sm border px-2 py-0.5 font-mono text-[11px] tracking-wide text-muted-foreground uppercase">
                        {group.grade?.segment}
                      </span>
                      <span className="ml-auto text-sm text-muted-foreground">
                        {missing === 0
                          ? 'All received'
                          : `${missing} of ${group.items.length} missing`}
                      </span>
                    </header>
                    <ul>
                      {group.items.map((item) => (
                        <li
                          key={item.entry.$id}
                          className="flex items-center gap-3 border-b px-4 py-2 text-sm last:border-b-0"
                        >
                          <span className="min-w-0 flex-1 font-medium">
                            {item.entry.userName}
                          </span>
                          {item.received ? (
                            <Badge variant="success">
                              <CheckCircle2 className="size-3.5" aria-hidden />
                              Received
                              {item.file?.duration
                                ? ` · ${formatDuration(item.file.duration)}`
                                : ''}
                              {item.file?.uploadedAt
                                ? ` · ${formatDate(item.file.uploadedAt)}`
                                : ''}
                            </Badge>
                          ) : (
                            <Badge variant="warning">
                              <CircleAlert className="size-3.5" aria-hidden />
                              Missing
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => remove(item.entry.$id)}
                            disabled={removing === item.entry.$id}
                            aria-label={`Remove ${item.entry.userName} from this grade`}
                            title="Remove entry"
                          >
                            <X />
                          </Button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )
              })}
            </div>
          )}

          <AddEntriesDialog
            open={addOpen}
            onOpenChange={setAddOpen}
            competitionId={competitionId}
            competitionLabel={competitionLabel}
            grades={overview.grades}
            competitors={competitors}
            entries={overview.entries}
            onAdded={() => loadOverview(competitionId)}
          />
        </>
      ) : null}
    </div>
  )
}

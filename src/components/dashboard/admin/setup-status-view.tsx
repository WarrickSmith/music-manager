import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Hammer,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import ErrorNotice from '@/components/ui/error-notice'
import { countReady } from '@/lib/appwrite/setup-report'
import type {
  InitializationResult,
  InitializationStatus,
  SetupItem,
  SetupState,
  SetupTable,
} from '@/lib/appwrite/setup-types'
import { cn } from '@/lib/utils'

const STATE_BADGE: Record<
  SetupState,
  { label: string; variant: 'success' | 'warning' | 'accent' | 'destructive' }
> = {
  ready: { label: 'Ready', variant: 'success' },
  missing: { label: 'Missing', variant: 'warning' },
  building: { label: 'Building', variant: 'accent' },
  error: { label: 'Error', variant: 'destructive' },
}

function StateBadge({ state }: { state: SetupState }) {
  const { label, variant } = STATE_BADGE[state]
  const Icon =
    state === 'ready'
      ? CheckCircle2
      : state === 'error'
        ? XCircle
        : state === 'building'
          ? Loader2
          : AlertTriangle
  return (
    <Badge variant={variant} className="shrink-0">
      <Icon
        className={cn('size-3.5', state === 'building' && 'animate-spin')}
        aria-hidden
      />
      {label}
    </Badge>
  )
}

function Section({
  title,
  hint,
  children,
}: {
  title: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <div>
        <h3 className="font-display text-lg font-bold">{title}</h3>
        {hint && <p className="text-sm text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

function ObjectRow({ item, kind }: { item: SetupItem; kind: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b px-4 py-3 last:border-b-0">
      <div className="min-w-0">
        <p className="label-mono">{kind}</p>
        <p className="font-mono text-[15px] font-medium break-all">
          {item.label}
        </p>
        {item.detail && (
          <p className="text-sm text-muted-foreground">{item.detail}</p>
        )}
        {item.error && (
          <p className="mt-1 text-sm break-words text-destructive">
            {item.error}
          </p>
        )}
      </div>
      <StateBadge state={item.state} />
    </div>
  )
}

function TableBlock({ table }: { table: SetupTable }) {
  const columns = countReady(table.columns)
  const indexes = countReady(table.indexes)
  return (
    <details
      className="group overflow-hidden rounded-lg border bg-card"
      open={table.state !== 'ready'}
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 hover:bg-secondary">
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[15px] font-medium">{table.label}</p>
          <p className="text-sm text-muted-foreground">{table.purpose}</p>
        </div>
        <span className="hidden font-mono text-xs text-muted-foreground tabular-nums sm:inline">
          {columns.ready}/{columns.total} columns · {indexes.ready}/
          {indexes.total} indexes
        </span>
        <StateBadge state={table.state} />
      </summary>

      <div className="grid gap-px border-t bg-border lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="bg-card">
          <p className="label-mono px-4 pt-3 pb-1">Columns</p>
          <ul>
            {table.columns.map((column) => (
              <li
                key={column.id}
                className="flex items-start justify-between gap-3 px-4 py-1.5 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-mono font-medium">{column.label}</span>{' '}
                  <span className="text-muted-foreground">{column.detail}</span>
                  {column.error && (
                    <span className="block break-words text-destructive">
                      {column.error}
                    </span>
                  )}
                </span>
                <StateBadge state={column.state} />
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-card">
          <p className="label-mono px-4 pt-3 pb-1">Indexes</p>
          <ul>
            {table.indexes.map((index) => (
              <li
                key={index.id}
                className="flex items-start justify-between gap-3 px-4 py-1.5 text-sm"
              >
                <span className="min-w-0">
                  <span className="font-mono font-medium">{index.label}</span>
                  <span className="block text-muted-foreground">
                    {index.detail}
                  </span>
                  {index.error && (
                    <span className="block break-words text-destructive">
                      {index.error}
                    </span>
                  )}
                </span>
                <StateBadge state={index.state} />
              </li>
            ))}
          </ul>
        </div>
      </div>
      {table.error && (
        <p className="border-t px-4 py-2 text-sm break-words text-destructive">
          {table.error}
        </p>
      )}
    </details>
  )
}

function Stat({
  label,
  value,
  state,
}: {
  label: string
  value: string
  state: SetupState
}) {
  return (
    <div
      className={cn(
        'rounded-lg border bg-card px-4 py-3',
        state === 'error' && 'border-destructive/60',
        state === 'missing' && 'border-warning/60',
      )}
    >
      <p className="font-display text-2xl leading-tight font-bold tabular-nums">
        {value}
      </p>
      <p className="label-mono">{label}</p>
    </div>
  )
}

const rollup = (items: SetupItem[]): SetupState =>
  items.some((i) => i.state === 'error')
    ? 'error'
    : items.some((i) => i.state === 'missing')
      ? 'missing'
      : items.some((i) => i.state === 'building')
        ? 'building'
        : 'ready'

export default function SetupStatusView({
  status,
  lastRun,
  checkError,
  isLoading,
  isInitializing,
  copied,
  onCheck,
  onCopy,
  onRun,
}: {
  status: InitializationStatus
  lastRun: InitializationResult | null
  checkError: string | null
  isLoading: boolean
  isInitializing: boolean
  copied: boolean
  onCheck: () => void
  onCopy: () => void
  onRun: () => void
}) {
  const { report } = status
  const allColumns = report.tables.flatMap((t) => t.columns)
  const allIndexes = report.tables.flatMap((t) => t.indexes)
  const everything: SetupItem[] = [
    report.database,
    ...report.tables,
    ...allColumns,
    ...allIndexes,
    report.bucket,
    ...report.teams,
  ]
  const overall = rollup(everything)
  const columns = countReady(allColumns)
  const indexes = countReady(allIndexes)
  const tables = countReady(report.tables)
  const teamsReady = countReady(report.teams)

  return (
    <div className="flex flex-col gap-5">
      {checkError && (
        <ErrorNotice
          title="The last status check failed"
          message="The details below are from the previous successful check."
          details={checkError}
          onRetry={onCheck}
        />
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat
          label="Database"
          value={report.database.state === 'ready' ? 'OK' : '--'}
          state={report.database.state}
        />
        <Stat
          label="Tables"
          value={`${tables.ready}/${tables.total}`}
          state={rollup(report.tables)}
        />
        <Stat
          label="Columns"
          value={`${columns.ready}/${columns.total}`}
          state={rollup(allColumns)}
        />
        <Stat
          label="Indexes"
          value={`${indexes.ready}/${indexes.total}`}
          state={rollup(allIndexes)}
        />
        <Stat
          label="Storage"
          value={report.bucket.state === 'ready' ? 'OK' : '--'}
          state={report.bucket.state}
        />
        <Stat
          label="Teams"
          value={`${teamsReady.ready}/${teamsReady.total}`}
          state={rollup(report.teams)}
        />
      </div>

      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4',
          overall === 'ready' ? 'border-success/50' : 'border-warning/60',
        )}
      >
        <div className="flex items-center gap-3">
          {overall === 'ready' ? (
            <CheckCircle2 className="size-6 text-success" />
          ) : overall === 'error' ? (
            <XCircle className="size-6 text-destructive" />
          ) : (
            <AlertTriangle className="size-6 text-warning" />
          )}
          <div>
            <p className="font-semibold">
              {overall === 'ready'
                ? 'Everything the app needs is set up'
                : overall === 'building'
                  ? 'Appwrite is still building some items'
                  : status.isInitialized
                    ? 'The app can run, but some items need attention'
                    : 'Some required items are missing'}
            </p>
            <p className="text-sm text-muted-foreground">
              {overall === 'ready'
                ? 'You can re-run setup at any time. It only creates what is missing.'
                : 'Run setup to create the missing items, then check again.'}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onCheck}
            disabled={isLoading || isInitializing}
          >
            <RefreshCw className={isLoading ? 'animate-spin' : ''} />
            Check again
          </Button>
          <Button variant="outline" onClick={onCopy}>
            {copied ? <Check /> : <Copy />}
            Copy setup report
          </Button>
          <Button onClick={onRun} disabled={isInitializing}>
            {isInitializing ? (
              <>
                <Loader2 className="animate-spin" /> Running setup...
              </>
            ) : (
              <>
                <Hammer />
                {overall === 'ready' ? 'Re-run setup' : 'Run setup'}
              </>
            )}
          </Button>
        </div>
      </div>

      {isInitializing && (
        <p className="text-sm text-muted-foreground" role="status">
          Creating items in Appwrite. This can take up to a minute while the
          columns are built.
        </p>
      )}

      {status.errors.length > 0 && (
        <ErrorNotice
          title="Appwrite returned errors"
          message="Some items could not be checked. This usually means the API key is missing a scope. Each affected item is marked Error below."
          details={status.errors.join('\n')}
        />
      )}

      {lastRun && (
        <div className="flex flex-col gap-3">
          {lastRun.success ? (
            <div className="rounded-lg border border-success/50 bg-success/10 p-4">
              <p className="flex items-center gap-2 font-semibold">
                <CheckCircle2 className="size-5 text-success" /> Setup finished
              </p>
            </div>
          ) : (
            <ErrorNotice
              title="Setup did not finish"
              message="Some items could not be created. Fix the cause shown below, then run setup again. Items that were created are kept."
              details={[
                ...(lastRun.errors ?? []),
                ...(lastRun.log?.length ? ['', 'Log:', ...lastRun.log] : []),
              ].join('\n')}
              onRetry={onRun}
            />
          )}
          {lastRun.log && lastRun.log.length > 0 && (
            <details className="rounded-lg border bg-card text-sm">
              <summary className="cursor-pointer px-4 py-2 font-medium">
                What setup did ({lastRun.log.length} steps)
              </summary>
              <ol className="max-h-60 overflow-auto border-t px-4 py-2 font-mono text-xs leading-relaxed">
                {lastRun.log.map((entry, i) => (
                  <li key={i}>{entry}</li>
                ))}
              </ol>
            </details>
          )}
        </div>
      )}

      <Section title="Database" hint="The container for the app's tables.">
        <div className="overflow-hidden rounded-lg border bg-card">
          <ObjectRow item={report.database} kind="Database ID" />
        </div>
      </Section>

      <Section
        title="Tables"
        hint="Each table lists the columns and indexes the app depends on. Tables with a problem open automatically."
      >
        <div className="flex flex-col gap-3">
          {report.tables.map((table) => (
            <TableBlock key={table.id} table={table} />
          ))}
        </div>
      </Section>

      <Section title="Storage" hint="Where uploaded music files are kept.">
        <div className="overflow-hidden rounded-lg border bg-card">
          <ObjectRow item={report.bucket} kind="Storage bucket ID" />
        </div>
      </Section>

      <Section
        title="Teams"
        hint="The two groups that the admin and competitor roles belong to."
      >
        <div className="overflow-hidden rounded-lg border bg-card">
          {report.teams.map((team) => (
            <ObjectRow key={team.id} item={team} kind="Team" />
          ))}
        </div>
      </Section>

      <div className="rounded-lg border bg-card p-4 text-sm">
        <p className="mb-1 font-display text-base font-bold">
          What running setup does
        </p>
        <ol className="list-inside list-decimal space-y-0.5 text-muted-foreground">
          <li>Creates the database if it is missing.</li>
          <li>
            Creates each missing table, then its missing columns, and waits
            while Appwrite builds them.
          </li>
          <li>
            Creates the storage bucket if it is missing, and re-applies its
            permissions.
          </li>
          <li>
            Creates the Administrators and Competitors teams if they are
            missing.
          </li>
          <li>Creates the missing indexes once the columns are ready.</li>
        </ol>
        <p className="mt-2 text-muted-foreground">
          Existing records and uploaded files are never changed or deleted.
        </p>
      </div>
    </div>
  )
}

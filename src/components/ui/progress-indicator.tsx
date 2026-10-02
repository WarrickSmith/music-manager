import { cn } from '@/lib/utils'
import {
  formatBytes,
  formatSpeed,
  formatTimeLeft,
} from '@/lib/upload/format'
import type { UploadStatus } from '@/hooks/useUploadProgress'

interface ProgressIndicatorProps {
  title: string
  progress: number
  status: Exclude<UploadStatus, 'idle'>
  loaded: number
  total: number
  bytesPerSecond: number
  className?: string
}

const STEPS = ['Uploading', 'Processing', 'Complete'] as const

function stepIndex(status: ProgressIndicatorProps['status']) {
  if (status === 'processing') return 1
  if (status === 'complete') return 3
  return 0
}

/**
 * Block-style upload progress: a bar with a tick every 10%, the exact bytes
 * sent, speed and time left, and the three phases of an upload.
 */
export function ProgressIndicator({
  title,
  progress,
  status,
  loaded,
  total,
  bytesPerSecond,
  className,
}: ProgressIndicatorProps) {
  const current = stepIndex(status)
  const failed = status === 'error'

  return (
    <div
      className={cn(
        'flex flex-col gap-3 rounded-lg border bg-background p-4',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-baseline justify-between gap-3">
        <span className="min-w-0 break-words font-semibold">{title}</span>
        <span className="font-mono text-3xl leading-none tabular-nums">
          {Math.floor(progress)}%
        </span>
      </div>

      <div
        className="relative h-4 overflow-hidden rounded-sm bg-secondary"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.floor(progress)}
      >
        <div
          className={cn(
            'absolute inset-y-0 left-0 transition-[width] duration-100 ease-linear',
            failed
              ? 'bg-destructive'
              : status === 'complete'
                ? 'bg-success'
                : 'bg-primary',
            status === 'processing' &&
              'animate-[stripe-slide_0.7s_linear_infinite] bg-[length:22px_22px] bg-[repeating-linear-gradient(135deg,var(--primary)_0_8px,color-mix(in_srgb,var(--primary)_60%,var(--secondary))_8px_16px)]',
          )}
          style={{ width: `${progress}%` }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,transparent_0_calc(10%-2px),var(--background)_calc(10%-2px)_10%)]" />
      </div>

      <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[13px] text-muted-foreground tabular-nums">
        {status === 'uploading' && (
          <>
            <span>
              <b className="font-medium text-foreground">
                {formatBytes(loaded)}
              </b>{' '}
              of {formatBytes(total)}
            </span>
            <span>{formatSpeed(bytesPerSecond)}</span>
            <span>{formatTimeLeft(loaded, total, bytesPerSecond)}</span>
          </>
        )}
        {status === 'processing' && (
          <span>
            All {formatBytes(total)} sent. Reading the length and saving
            your file.
          </span>
        )}
        {status === 'complete' && (
          <span className="text-success">
            Uploaded {formatBytes(total)}. Your file is ready.
          </span>
        )}
        {failed && (
          <span className="text-destructive">
            Stopped at {formatBytes(loaded)} of {formatBytes(total)}.
          </span>
        )}
      </div>

      <ol className="grid grid-cols-3 gap-px overflow-hidden rounded-md border bg-border text-sm">
        {STEPS.map((step, i) => (
          <li
            key={step}
            className={cn(
              'flex items-center gap-2 bg-card px-3 py-1.5',
              i < current && 'text-success',
              i === current && !failed && 'font-semibold text-foreground',
              i === current && failed && 'font-semibold text-destructive',
              i > current && 'text-muted-foreground',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'size-2 shrink-0 rounded-[2px]',
                i < current && 'bg-success',
                i === current && !failed && 'bg-primary',
                i === current && failed && 'bg-destructive',
                i > current && 'bg-border',
              )}
            />
            {step}
          </li>
        ))}
      </ol>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { AlertTriangle, Check, Copy, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildErrorReport, copyText } from '@/lib/error-report'
import { cn } from '@/lib/utils'

/**
 * Inline error panel. It says what went wrong in plain words, offers a retry,
 * and lets the user copy a full error report to send to the site admin.
 */
export default function ErrorNotice({
  title,
  message,
  details,
  onRetry,
  className,
}: {
  title: string
  message: string
  /** Technical cause, included in the copied report */
  details?: string
  onRetry?: () => void
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const copyReport = async () => {
    const ok = await copyText(buildErrorReport({ title, message, details }))
    setCopied(ok)
    if (ok) setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4',
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
        <div className="min-w-0">
          <p className="font-semibold">{title}</p>
          <p className="mt-0.5 text-sm break-words text-muted-foreground">
            {message}
          </p>
          {details && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer font-medium text-foreground">
                Technical details
              </summary>
              <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-background p-2 font-mono text-xs break-words whitespace-pre-wrap">
                {details}
              </pre>
            </details>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-2 pl-8">
        {onRetry && (
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            <RefreshCw /> Try again
          </Button>
        )}
        <Button type="button" size="sm" variant="outline" onClick={copyReport}>
          {copied ? <Check /> : <Copy />}
          {copied ? 'Copied' : 'Copy error report'}
        </Button>
      </div>
    </div>
  )
}

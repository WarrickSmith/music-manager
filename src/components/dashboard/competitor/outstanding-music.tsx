'use client'

import { useEffect, useState } from 'react'
import { Upload } from 'lucide-react'
import {
  getOutstandingMusic,
  type OutstandingMusic,
} from '@/app/actions/entry-actions'
import { Button } from '@/components/ui/button'
import { useDashboardTab } from '@/components/layout/dashboard-shell'
import { deadlineStatus } from '@/lib/deadline'
import { gradeChipClass } from '@/lib/grade-tone'
import { cn } from '@/lib/utils'

/**
 * Programmes the skater is entered in that still have no music. Shows nothing
 * when there is nothing outstanding, or when entries have not been set up, so
 * it never gets in the way.
 */
export default function OutstandingMusicPanel({ userId }: { userId: string }) {
  const [items, setItems] = useState<OutstandingMusic[]>([])
  const goToTab = useDashboardTab()

  useEffect(() => {
    let cancelled = false
    getOutstandingMusic(userId)
      .then((result) => {
        if (!cancelled && result.ok) setItems(result.data)
      })
      .catch((error) => console.error('Could not load entries:', error))
    return () => {
      cancelled = true
    }
  }, [userId])

  if (items.length === 0) return null

  return (
    <section
      className="overflow-hidden rounded-lg border border-warning/60 bg-card"
      aria-label="Music still needed"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b bg-warning/10 px-4 py-3">
        <h3 className="font-display text-base font-bold">
          Music still needed ({items.length})
        </h3>
        {goToTab && (
          <Button size="sm" onClick={() => goToTab('upload')}>
            <Upload /> Upload music
          </Button>
        )}
      </header>
      <ul>
        {items.map((item) => {
          const deadline = deadlineStatus(item.uploadDeadline)
          return (
            <li
              key={item.entryId}
              className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b px-4 py-2.5 text-sm last:border-b-0"
            >
              <span
                className={cn(
                  'rounded-sm px-2 py-0.5 text-[13px] font-bold whitespace-nowrap',
                  gradeChipClass(item.gradeType),
                )}
              >
                {item.gradeType}
              </span>
              <span className="font-semibold">{item.gradeCategory}</span>
              <span className="font-mono text-xs text-muted-foreground uppercase">
                {item.gradeSegment}
              </span>
              <span className="text-muted-foreground">
                {item.competitionYear} {item.competitionName}
              </span>
              {deadline.state !== 'none' && (
                <span
                  className={cn(
                    'ml-auto text-xs font-medium',
                    deadline.state === 'closed'
                      ? 'text-destructive'
                      : deadline.state === 'closing-soon'
                        ? 'text-warning'
                        : 'text-muted-foreground',
                  )}
                >
                  {deadline.label}
                </span>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

import type { ReactNode } from 'react'

/**
 * Title block shared by every dashboard section so admin and competitor
 * screens read the same: a heading, one line of help text, and the primary
 * actions on the right.
 */
export default function PageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="font-display text-3xl leading-tight font-extrabold tracking-tight text-balance">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 max-w-[60ch] text-muted-foreground">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

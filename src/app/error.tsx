'use client'

import { useEffect } from 'react'
import ErrorNotice from '@/components/ui/error-notice'

/**
 * Catches errors thrown while rendering any page, keeping the navigation bar
 * on screen. In production Next.js hides the real message, so the digest is
 * what the site admin needs to find the matching server log entry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Page error:', error)
  }, [error])

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <ErrorNotice
        title="This page hit a problem"
        message="Something went wrong while showing this page. You can try again. If it keeps happening, copy the error report and send it to your club admin."
        details={[
          error.message && `Message: ${error.message}`,
          error.digest && `Digest: ${error.digest}`,
        ]
          .filter(Boolean)
          .join('\n')}
        onRetry={reset}
      />
    </div>
  )
}

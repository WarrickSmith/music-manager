'use client'

/**
 * Last-resort boundary for errors in the root layout itself. It renders its
 * own html and body, so it cannot use the app's components or theme.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#121719',
          color: '#eef3f1',
          margin: 0,
          padding: '3rem 1rem',
        }}
      >
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h1 style={{ fontSize: 28 }}>Music Manager hit a problem</h1>
          <p style={{ color: '#93a5a8' }}>
            The app could not load. Try again. If it keeps happening, send this
            to your club admin:
          </p>
          <pre
            style={{
              background: '#1a2124',
              border: '1px solid #324045',
              borderRadius: 8,
              padding: 12,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {`Time: ${new Date().toISOString()}\nMessage: ${error.message}${
              error.digest ? `\nDigest: ${error.digest}` : ''
            }`}
          </pre>
          <button
            onClick={reset}
            style={{
              background: '#92c8ff',
              color: '#0b1c2e',
              border: 0,
              borderRadius: 6,
              padding: '10px 16px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}

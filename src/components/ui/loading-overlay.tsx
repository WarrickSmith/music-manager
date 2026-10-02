export default function LoadingOverlay({
  message = 'Loading...',
}: {
  message?: string
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center rounded-lg border bg-card px-8 py-7 shadow-2xl shadow-black/20">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-border border-t-primary"></div>
        <p className="mt-4 font-medium text-foreground">{message}</p>
      </div>
    </div>
  )
}

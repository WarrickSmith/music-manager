export default function LoadingOverlay({
  message = 'Loading...',
}: {
  message?: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 backdrop-blur-md">
      <div className="flex flex-col items-center rounded-3xl border border-slate-200/70 bg-white/92 px-8 py-7 shadow-2xl shadow-slate-950/15 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/88 dark:shadow-black/35">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-b-sky-500 border-l-transparent border-r-transparent border-t-violet-500 dark:border-b-sky-300 dark:border-t-violet-300"></div>
        <p className="mt-4 font-medium text-slate-700 dark:text-slate-100">
          {message}
        </p>
      </div>
    </div>
  )
}

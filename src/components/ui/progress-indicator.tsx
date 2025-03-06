import { cva } from 'class-variance-authority'

interface ProgressIndicatorProps {
  progress: number
  status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error'
  showPercentage?: boolean
  className?: string
}

const statusTextVariants = cva('text-sm text-center mt-1', {
  variants: {
    status: {
      idle: 'text-emerald-400',
      uploading: 'text-emerald-500',
      processing: 'text-emerald-500',
      complete: 'text-emerald-500',
      error: 'text-red-500',
    },
  },
})

export function ProgressIndicator({
  progress,
  status,
  showPercentage = true,
  className,
}: ProgressIndicatorProps) {
  const getStatusText = () => {
    switch (status) {
      case 'idle':
        return 'Ready'
      case 'uploading':
        return `Uploading${showPercentage ? ` (${Math.round(progress)}%)` : ''}`
      case 'processing':
        return 'Processing file...'
      case 'complete':
        return 'Complete!'
      case 'error':
        return 'Error encountered'
    }
  }

  // Generate a gradient background for the progress bar
  const getProgressBackground = () => {
    if (status === 'error') {
      return 'bg-red-500'
    }

    return 'bg-gradient-to-r from-emerald-300 to-emerald-500'
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${getProgressBackground()} transition-all duration-300`}
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <p className={statusTextVariants({ status })}>{getStatusText()}</p>
    </div>
  )
}

import { Progress } from '@/components/ui/progress'
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

const progressVariants = cva('h-4 w-full', {
  variants: {
    status: {
      idle: '',
      uploading: '!bg-emerald-500',
      processing: '!bg-emerald-500',
      complete: '!bg-emerald-500',
      error: '!bg-red-500',
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

  return (
    <div className={`space-y-1 ${className}`}>
      <Progress value={progress} className={progressVariants({ status })} />
      <p className={statusTextVariants({ status })}>{getStatusText()}</p>
    </div>
  )
}

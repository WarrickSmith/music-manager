import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format a file size in bytes to a human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Format duration in seconds to a human-readable string (MM:SS or HH:MM:SS)
 */
export function formatDuration(seconds: number): string {
  if (!seconds && seconds !== 0) return 'Unknown'

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  // Add leading zeros
  const paddedMinutes = String(minutes).padStart(2, '0')
  const paddedSeconds = String(remainingSeconds).padStart(2, '0')

  // Include hours only if there are any
  if (hours > 0) {
    return `${hours}:${paddedMinutes}:${paddedSeconds}`
  }

  return `${paddedMinutes}:${paddedSeconds}`
}

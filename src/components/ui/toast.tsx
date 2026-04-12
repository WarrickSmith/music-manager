import { toast } from 'sonner'

interface ToastOptions {
  description?: string
  duration?: number
  id?: string | number
}

function variantClasses(
  borderClass: string,
  lightSurfaceClass: string,
  darkSurfaceClass: string,
  lightTextClass: string,
  darkTextClass: string
) {
  return {
    toast: `group border-l-4 ${borderClass} ${lightSurfaceClass} ${lightTextClass} ${darkSurfaceClass} ${darkTextClass}`,
    title: `font-medium ${lightTextClass} ${darkTextClass}`,
    description: `${lightTextClass} ${darkTextClass} opacity-90`,
  }
}

/**
 * Enhanced toast notification utility with custom styling
 * This provides themed toasts based on event type
 */
export const showToast = {
  success: (title: string, options?: ToastOptions) => {
    toast.success(title, {
      classNames: variantClasses(
        'border-emerald-500 dark:border-emerald-400',
        'bg-emerald-50/95',
        'dark:bg-emerald-950/85',
        'text-emerald-900',
        'dark:text-emerald-100'
      ),
      ...options,
    })
  },

  error: (title: string, options?: ToastOptions) => {
    toast.error(title, {
      classNames: variantClasses(
        'border-red-500 dark:border-red-400',
        'bg-red-50/95',
        'dark:bg-red-950/85',
        'text-red-900',
        'dark:text-red-100'
      ),
      ...options,
    })
  },

  warning: (title: string, options?: ToastOptions) => {
    toast.warning(title, {
      classNames: variantClasses(
        'border-amber-500 dark:border-amber-400',
        'bg-amber-50/95',
        'dark:bg-amber-950/85',
        'text-amber-900',
        'dark:text-amber-100'
      ),
      ...options,
    })
  },

  info: (title: string, options?: ToastOptions) => {
    toast.info(title, {
      classNames: variantClasses(
        'border-sky-500 dark:border-sky-400',
        'bg-sky-50/95',
        'dark:bg-sky-950/85',
        'text-sky-900',
        'dark:text-sky-100'
      ),
      ...options,
    })
  },

  login: (title: string, options?: ToastOptions) => {
    toast.success(title, {
      classNames: variantClasses(
        'border-violet-500 dark:border-violet-400',
        'bg-violet-50/95',
        'dark:bg-violet-950/85',
        'text-violet-900',
        'dark:text-violet-100'
      ),
      ...options,
    })
  },

  logout: (title: string, options?: ToastOptions) => {
    toast.info(title, {
      classNames: variantClasses(
        'border-amber-500 dark:border-amber-400',
        'bg-amber-50/95',
        'dark:bg-amber-950/85',
        'text-amber-900',
        'dark:text-amber-100'
      ),
      ...options,
    })
  },
}

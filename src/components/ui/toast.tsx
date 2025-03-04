import { toast } from 'sonner'

interface ToastOptions {
  description?: string
  duration?: number
  id?: string | number
}

/**
 * Enhanced toast notification utility with custom styling
 * This provides themed toasts based on event type
 */
export const showToast = {
  success: (title: string, options?: ToastOptions) => {
    toast.success(title, {
      classNames: {
        toast: 'group border-green-500 border-l-4 bg-green-50 text-green-800',
        title: 'text-green-800 font-medium',
        description: 'text-green-700',
      },
      ...options,
    })
  },

  error: (title: string, options?: ToastOptions) => {
    toast.error(title, {
      classNames: {
        toast: 'group border-red-500 border-l-4 bg-red-50 text-red-800',
        title: 'text-red-800 font-medium',
        description: 'text-red-700',
      },
      ...options,
    })
  },

  warning: (title: string, options?: ToastOptions) => {
    toast.warning(title, {
      classNames: {
        toast:
          'group border-yellow-500 border-l-4 bg-yellow-50 text-yellow-800',
        title: 'text-yellow-800 font-medium',
        description: 'text-yellow-700',
      },
      ...options,
    })
  },

  info: (title: string, options?: ToastOptions) => {
    toast.info(title, {
      classNames: {
        toast: 'group border-blue-500 border-l-4 bg-blue-50 text-blue-800',
        title: 'text-blue-800 font-medium',
        description: 'text-blue-700',
      },
      ...options,
    })
  },

  login: (title: string, options?: ToastOptions) => {
    toast.success(title, {
      classNames: {
        toast:
          'group border-purple-500 border-l-4 bg-purple-50 text-purple-800',
        title: 'text-purple-800 font-medium',
        description: 'text-purple-700',
      },
      ...options,
    })
  },

  logout: (title: string, options?: ToastOptions) => {
    toast.info(title, {
      classNames: {
        toast: 'group border-amber-500 border-l-4 bg-amber-50 text-amber-800',
        title: 'text-amber-800 font-medium',
        description: 'text-amber-700',
      },
      ...options,
    })
  },
}

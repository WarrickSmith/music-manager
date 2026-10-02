import { toast } from 'sonner'

interface ToastOptions {
  description?: string
  duration?: number
  id?: string | number
}

function variantClasses(borderClass: string) {
  return {
    toast: `group border-l-4 ${borderClass} bg-card text-card-foreground`,
    title: 'font-semibold text-card-foreground',
    description: 'text-muted-foreground',
  }
}

/**
 * Enhanced toast notification utility with custom styling
 * This provides themed toasts based on event type
 */
export const showToast = {
  success: (title: string, options?: ToastOptions) => {
    toast.success(title, {
      classNames: variantClasses('border-l-success'),
      ...options,
    })
  },

  error: (title: string, options?: ToastOptions) => {
    toast.error(title, {
      classNames: variantClasses('border-l-destructive'),
      ...options,
    })
  },

  warning: (title: string, options?: ToastOptions) => {
    toast.warning(title, {
      classNames: variantClasses('border-l-warning'),
      ...options,
    })
  },

  info: (title: string, options?: ToastOptions) => {
    toast.info(title, {
      classNames: variantClasses('border-l-primary'),
      ...options,
    })
  },

  login: (title: string, options?: ToastOptions) => {
    toast.success(title, {
      classNames: variantClasses('border-l-primary'),
      ...options,
    })
  },

  logout: (title: string, options?: ToastOptions) => {
    toast.info(title, {
      classNames: variantClasses('border-l-warning'),
      ...options,
    })
  },
}

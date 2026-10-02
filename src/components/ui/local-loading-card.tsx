import { Card, CardContent } from '@/components/ui/card'
import { RefreshCw } from 'lucide-react'

interface LocalLoadingCardProps {
  message?: string
  minHeight?: string
}

/**
 * Shows a localized loading spinner within a card
 * This is preferred over a full-screen overlay for component-level loading states
 */
export default function LocalLoadingCard({
  message = 'Loading...',
  minHeight = '200px',
}: LocalLoadingCardProps) {
  return (
    <Card>
      <CardContent
        className="flex items-center justify-center p-6"
        style={{ minHeight }}
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-9 w-9 animate-spin text-primary" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}

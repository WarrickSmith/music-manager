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
    <Card className="border-indigo-100">
      <CardContent
        className="p-6 flex items-center justify-center"
        style={{ minHeight }}
      >
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-10 w-10 animate-spin text-indigo-600" />
          <p className="text-indigo-600">{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}

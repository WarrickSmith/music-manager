'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { updateCompetitionStatus } from '@/app/actions/competition-actions'
import { toast } from 'sonner'

interface CompetitionCardProps {
  competition: {
    $id: string
    name: string
    year: number
    active: boolean
  }
  isSelected: boolean
  onSelect: () => void
}

export default function CompetitionCard({
  competition,
  isSelected,
  onSelect,
}: CompetitionCardProps) {
  const handleStatusChange = async (checked: boolean) => {
    try {
      await updateCompetitionStatus(competition.$id, checked)
      toast.success(`Competition ${checked ? 'activated' : 'deactivated'}`)
    } catch (error) {
      toast.error(`Failed to update status: ${(error as Error).message}`)
    }
  }

  return (
    <Card
      className={`
        cursor-pointer 
        transition-all 
        hover:shadow-md 
        ${isSelected ? 'border-primary bg-primary/5' : 'hover:bg-accent/50'}
      `}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{competition.name}</h3>
            <div className="flex items-center mt-1 gap-2">
              <Badge
                variant={competition.active ? 'default' : 'outline'}
                className={
                  competition.active ? 'bg-green-500 hover:bg-green-600' : ''
                }
              >
                {competition.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <Switch
            checked={competition.active}
            onCheckedChange={handleStatusChange}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            aria-label={`Competition ${
              competition.active ? 'active' : 'inactive'
            }`}
          />
        </div>
      </CardContent>
    </Card>
  )
}

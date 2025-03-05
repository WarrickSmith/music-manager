'use client'
import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  updateCompetitionStatus,
  deleteCompetition,
} from '@/app/actions/competition-actions'
import { toast } from 'sonner'
import { Trash } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface CompetitionCardProps {
  competition: {
    $id: string
    name: string
    year: number
    active: boolean
  }
  isSelected: boolean
  onSelect: () => void
  onUpdate?: () => void // Optional callback to notify parent when competition is updated
}

export default function CompetitionCard({
  competition: initialCompetition,
  isSelected,
  onSelect,
  onUpdate,
}: CompetitionCardProps) {
  // Use local state to track competition data, allowing for UI updates without refetching
  const [competition, setCompetition] = useState(initialCompetition)

  const handleStatusChange = async (checked: boolean) => {
    try {
      await updateCompetitionStatus(competition.$id, checked)
      // Update local state to reflect the change
      setCompetition({
        ...competition,
        active: checked,
      })
      toast.success(`Competition ${checked ? 'activated' : 'deactivated'}`)
      if (onUpdate) onUpdate() // Notify parent if needed
    } catch (error) {
      toast.error(`Failed to update status: ${(error as Error).message}`)
    }
  }

  const handleDeleteCompetition = async () => {
    try {
      await deleteCompetition(competition.$id)
      toast.success('Competition and associated grades deleted successfully')
      if (onUpdate) onUpdate() // Notify parent to refresh competition list
    } catch (error) {
      toast.error(`Failed to delete competition: ${(error as Error).message}`)
    }
  }

  return (
    <Card
      className={`
        cursor-pointer 
        transition-all 
        hover:shadow-md 
        ${isSelected ? 'border-indigo-400 bg-indigo-50' : 'hover:bg-slate-50'}
      `}
      onClick={onSelect}
    >
      <CardContent className="p-3">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium text-indigo-700">{competition.name}</h3>
            <div className="flex items-center mt-1 gap-2">
              <Badge
                variant={competition.active ? 'default' : 'outline'}
                className={
                  competition.active
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-yellow-300'
                }
              >
                {competition.active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              checked={competition.active}
              onCheckedChange={handleStatusChange}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
              className={
                competition.active ? 'data-[state=checked]:bg-green-500' : ''
              }
              aria-label={`Competition ${
                competition.active ? 'active' : 'inactive'
              }`}
            />

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  onClick={(e: React.MouseEvent) => e.stopPropagation()}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Competition</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{competition.name}"? This
                    action cannot be undone and will also delete all associated
                    grades.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground"
                    onClick={handleDeleteCompetition}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

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
import { Trash, Loader2 } from 'lucide-react'
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
  isDeleting?: boolean
  onDeleteStart?: () => void
  onDeleteSuccess?: (competitionId: string) => void
  onUpdate?: () => void // Optional callback to notify parent when competition is updated
}

export default function CompetitionCard({
  competition: initialCompetition,
  isSelected,
  onSelect,
  isDeleting = false,
  onDeleteStart,
  onDeleteSuccess,
  onUpdate,
}: CompetitionCardProps) {
  // Use local state to track competition data, allowing for UI updates without refetching
  const [competition, setCompetition] = useState(initialCompetition)
  const [internalDeleting, setInternalDeleting] = useState(false)

  // Combine external and internal deleting states
  const showDeleteSpinner = isDeleting || internalDeleting

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
      // Notify parent component that deletion is starting
      if (onDeleteStart) {
        onDeleteStart()
      }

      // Set internal deleting state as a fallback
      setInternalDeleting(true)

      // Delete the competition
      await deleteCompetition(competition.$id)

      toast.success('Competition and associated grades deleted successfully')

      // Call the onDeleteSuccess callback with the competition ID
      if (onDeleteSuccess) {
        onDeleteSuccess(competition.$id)
      }
    } catch (error) {
      toast.error(`Failed to delete competition: ${(error as Error).message}`)
      // Reset deleting state if there was an error
      setInternalDeleting(false)
    }
  }

  // If the competition is being deleted, show a spinner instead of the card
  if (showDeleteSpinner) {
    return (
      <div className="flex items-center justify-center h-full min-h-[100px] bg-indigo-50 rounded-lg border border-indigo-100 animate-pulse">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="text-sm text-indigo-500 font-medium">
            Deleting...
          </span>
        </div>
      </div>
    )
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
      <CardContent className="p-3 space-y-2">
        <h3 className="font-medium text-indigo-700 text-lg">
          {competition.name}
        </h3>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
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
          </div>
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
                  Are you sure you want to delete &quot;{competition.name}
                  &quot;? This action cannot be undone and will also delete all
                  associated grades.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  className="bg-destructive text-white font-medium hover:bg-red-600"
                  onClick={handleDeleteCompetition}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  )
}

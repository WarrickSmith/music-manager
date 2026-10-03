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
import { Trash, Loader2, CalendarClock } from 'lucide-react'
import DeadlineDialog from './deadline-dialog'
import { deadlineStatus } from '@/lib/deadline'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
    uploadDeadline?: string | null
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
  const [showDeadline, setShowDeadline] = useState(false)
  const deadline = deadlineStatus(competition.uploadDeadline)

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
      <div className="flex h-full min-h-[100px] animate-pulse items-center justify-center rounded-lg border bg-card">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-muted-foreground">
            Deleting...
          </span>
        </div>
      </div>
    )
  }

  return (
    <Card
      className={cn(
        'cursor-pointer gap-0 py-0 transition-colors',
        isSelected
          ? 'border-primary bg-accent'
          : 'hover:border-muted-foreground/60'
      )}
      onClick={onSelect}
    >
      <CardContent className="space-y-2 p-3">
        <h3 className="font-display text-base font-bold">{competition.name}</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarClock className="size-4 shrink-0" aria-hidden />
          <span
            className={
              deadline.state === 'closed'
                ? 'font-medium text-destructive'
                : deadline.state === 'closing-soon'
                  ? 'font-medium text-warning'
                  : undefined
            }
          >
            {deadline.state === 'none' ? 'No upload deadline' : deadline.label}
          </span>
          <button
            type="button"
            className="ml-auto font-semibold text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              setShowDeadline(true)
            }}
          >
            {deadline.state === 'none' ? 'Set deadline' : 'Change'}
          </button>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Badge variant={competition.active ? 'success' : 'outline'}>
              {competition.active ? 'Active' : 'Inactive'}
            </Badge>
            <Switch
              checked={competition.active}
              onCheckedChange={handleStatusChange}
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                className="text-muted-foreground hover:text-destructive"
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
                  className={cn(buttonVariants({ variant: 'destructive' }))}
                  onClick={handleDeleteCompetition}
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
      <DeadlineDialog
        competitionId={competition.$id}
        competitionName={competition.name}
        current={competition.uploadDeadline}
        open={showDeadline}
        onOpenChange={setShowDeadline}
        onSaved={(uploadDeadline) => {
          setCompetition({ ...competition, uploadDeadline })
          if (onUpdate) onUpdate()
        }}
      />
    </Card>
  )
}

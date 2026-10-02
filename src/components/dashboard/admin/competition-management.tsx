'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getCompetitions } from '@/app/actions/competition-actions'
import CompetitionList from './competition-list'
import CreateCompetitionDialog from './create-competition-dialog'
import GradeManagement from './grade-management'
import LocalLoadingCard from '@/components/ui/local-loading-card'
import ErrorNotice from '@/components/ui/error-notice'
import PageHeader from '@/components/layout/page-header'

interface Competition {
  $id: string
  name: string
  year: number
  active: boolean
}

export default function CompetitionManagement() {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  // Track IDs of competitions being deleted for optimistic UI updates
  const [deletingCompetitionIds, setDeletingCompetitionIds] = useState<
    Set<string>
  >(new Set())

  // Memoize loadCompetitions without selectedCompetition dependency
  const loadCompetitions = useCallback(async () => {
    setIsLoading(true)
    setLoadError(null)
    try {
      const data = await getCompetitions()
      setCompetitions(data as unknown as Competition[])
    } catch (error) {
      console.error('Failed to load competitions:', error)
      setLoadError((error as Error).message)
      toast.error(`Failed to load competitions: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }, []) // No dependencies needed

  // Separate effect to handle selection updates when competitions change
  useEffect(() => {
    if (selectedCompetition) {
      // Try to find the current selection in the updated competitions
      const updatedCompetition = competitions.find(
        (comp) => comp.$id === selectedCompetition.$id,
      )

      if (updatedCompetition) {
        // Update selected competition with latest data
        setSelectedCompetition(updatedCompetition)
      } else if (competitions.length > 0) {
        // If not found, select the first available competition
        setSelectedCompetition(competitions[0])
      } else {
        // If no competitions available, clear selection
        setSelectedCompetition(null)
      }
    } else if (competitions.length > 0 && !selectedCompetition) {
      // For initial load, select the first competition if available
      setSelectedCompetition(competitions[0])
    }
  }, [competitions, selectedCompetition])

  // Load competitions on mount
  useEffect(() => {
    loadCompetitions()
  }, [loadCompetitions])

  // Handle starting the deletion process - for optimistic UI
  const handleDeleteStart = (competitionId: string) => {
    setDeletingCompetitionIds((prev) => {
      const newSet = new Set(prev)
      newSet.add(competitionId)
      return newSet
    })

    // If the competition being deleted is selected, show loading state in grades panel
    if (selectedCompetition && selectedCompetition.$id === competitionId) {
      // We keep the selected competition, but the grades panel will show its own loading state
    }
  }

  // Handle successful deletion - remove from local state
  const handleDeleteSuccess = (competitionId: string) => {
    // Update local state optimistically
    setCompetitions((prevCompetitions) =>
      prevCompetitions.filter((c) => c.$id !== competitionId),
    )

    // If the deleted competition was selected, select another one
    if (selectedCompetition && selectedCompetition.$id === competitionId) {
      // Find the next competition to select
      const remainingCompetitions = competitions.filter(
        (c) => c.$id !== competitionId && !deletingCompetitionIds.has(c.$id),
      )

      if (remainingCompetitions.length > 0) {
        setSelectedCompetition(remainingCompetitions[0])
      } else {
        setSelectedCompetition(null)
      }
    }

    // Remove from the deleting set
    setDeletingCompetitionIds((prev) => {
      const newSet = new Set(prev)
      newSet.delete(competitionId)
      return newSet
    })
  }

  // Check if a competition is being deleted
  const isCompetitionDeleting = (competitionId: string) => {
    return deletingCompetitionIds.has(competitionId)
  }

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Competitions"
        description="Create competitions, switch them on when uploads should open, and manage each one's grades."
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus /> New competition
          </Button>
        }
      />

      {loadError && (
        <ErrorNotice
          title="Could not load competitions"
          message="The list of competitions could not be loaded. Check that the backend is set up on the Setup tab, then try again."
          details={loadError}
          onRetry={loadCompetitions}
        />
      )}

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <div className="md:col-span-4">
          {isLoading ? (
            <LocalLoadingCard
              message="Loading competitions..."
              minHeight="200px"
            />
          ) : (
            <Card>
              <CardContent className="p-4">
                {competitions.length === 0 ? (
                  <div className="py-8 text-center">
                    No competitions found. Create your first competition!
                  </div>
                ) : (
                  <CompetitionList
                    competitions={competitions}
                    selectedCompetition={selectedCompetition}
                    onSelectCompetition={setSelectedCompetition}
                    onCompetitionUpdate={loadCompetitions}
                    isCompetitionDeleting={isCompetitionDeleting}
                    onDeleteStart={handleDeleteStart}
                    onDeleteSuccess={handleDeleteSuccess}
                  />
                )}
              </CardContent>
            </Card>
          )}
          {showCreateDialog && (
            <CreateCompetitionDialog
              competitions={competitions}
              open={showCreateDialog}
              onOpenChange={setShowCreateDialog}
              onSuccess={() => {
                loadCompetitions()
                setShowCreateDialog(false)
              }}
            />
          )}
        </div>

        <div className="md:col-span-8">
          {selectedCompetition ? (
            <GradeManagement
              competition={selectedCompetition}
              onCompetitionUpdate={loadCompetitions}
              isCompetitionDeleting={
                selectedCompetition &&
                deletingCompetitionIds.has(selectedCompetition.$id)
              }
            />
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <p>Select a competition to manage its grades</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

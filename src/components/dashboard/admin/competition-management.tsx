'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { getCompetitions } from '@/app/actions/competition-actions'
import CompetitionList from './competition-list'
import CreateCompetitionDialog from './create-competition-dialog'
import GradeManagement from './grade-management'

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
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  useEffect(() => {
    loadCompetitions()
  }, [])

  const loadCompetitions = async () => {
    setIsLoading(true)
    try {
      const data = await getCompetitions()
      setCompetitions(data as unknown as Competition[])
      if (data.length > 0 && !selectedCompetition) {
        setSelectedCompetition(data[0] as unknown as Competition)
      }
    } catch (error) {
      toast.error(`Failed to load competitions: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="md:col-span-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Competitions</h2>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Create New
          </Button>
        </div>

        <Card>
          <CardContent className="p-4">
            {isLoading ? (
              <div className="py-8 text-center">Loading competitions...</div>
            ) : competitions.length === 0 ? (
              <div className="py-8 text-center">
                No competitions found. Create your first competition!
              </div>
            ) : (
              <CompetitionList
                competitions={competitions}
                selectedCompetition={selectedCompetition}
                onSelectCompetition={setSelectedCompetition}
              />
            )}
          </CardContent>
        </Card>

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
          />
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">
                Select a competition to manage its grades
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

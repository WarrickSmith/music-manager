'use client'

import { useState, useEffect, useCallback } from 'react'
import { AppwriteSetupModal } from './AppwriteSetupModal'
import { CreateCompetitionDialog } from './CreateCompetitionDialog'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Competition, Grade } from '@/types/competition'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface CompetitionManagementProps {
  onSwitchTab: (tab: 'users' | 'competitions') => void
}

export function CompetitionManagement({
  onSwitchTab,
}: CompetitionManagementProps) {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingGrades, setLoadingGrades] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAppwriteSetup, setShowAppwriteSetup] = useState(false)
  const [selectedCompetition, setSelectedCompetition] =
    useState<Competition | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)

  // Competition deletion state
  const [deleteCompetitionDialogOpen, setDeleteCompetitionDialogOpen] =
    useState(false)
  const [competitionToDelete, setCompetitionToDelete] = useState<string | null>(
    null
  )
  const [competitionNameToDelete, setCompetitionNameToDelete] =
    useState<string>('')

  // Grade deletion state
  const [deleteGradeDialogOpen, setDeleteGradeDialogOpen] = useState(false)
  const [gradeToDelete, setGradeToDelete] = useState<string | null>(null)
  const [gradeNameToDelete, setGradeNameToDelete] = useState<string>('')

  // API functions
  const fetchGradesList = async (competitionId: string) => {
    const response = await fetch(`/api/grades?competitionId=${competitionId}`)
    if (!response.ok) {
      throw new Error('Failed to fetch grades')
    }
    const data = await response.json()
    return data.grades
  }

  // Hook functions with useCallback
  const fetchCompetitions = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/competitions')
      const data = await response.json()

      if (response.status === 404 && data.error === 'Database not found') {
        setShowAppwriteSetup(true)
        setCompetitions([])
        return
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch competitions')
      }

      setCompetitions(data.competitions)
    } catch (err) {
      setError('Failed to fetch competitions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchGrades = useCallback(async (competitionId: string) => {
    try {
      setLoadingGrades(true)
      setError(null)
      const grades = await fetchGradesList(competitionId)
      setGrades(grades)
    } catch (err) {
      setError('Failed to fetch grades')
      console.error(err)
    } finally {
      setLoadingGrades(false)
    }
  }, [])

  // Data mutation functions
  const createNewCompetition = async (
    data: Omit<Competition, '$id' | '$createdAt' | '$updatedAt'>
  ) => {
    const response = await fetch('/api/competitions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create competition')
    }
    return response.json()
  }

  const cloneExistingCompetition = async (
    sourceCompetitionId: string,
    newCompetitionData: Partial<Competition>
  ) => {
    const response = await fetch('/api/competitions/clone', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourceCompetitionId, ...newCompetitionData }),
    })
    if (!response.ok) {
      throw new Error('Failed to clone competition')
    }
    return response.json()
  }

  const updateExistingCompetition = async (
    competitionId: string,
    data: Partial<Competition>
  ) => {
    const response = await fetch('/api/competitions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitionId, ...data }),
    })
    if (!response.ok) {
      throw new Error('Failed to update competition')
    }
    return response.json()
  }

  const deleteExistingCompetition = async (competitionId: string) => {
    const response = await fetch('/api/competitions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ competitionId }),
    })
    if (!response.ok) {
      throw new Error('Failed to delete competition')
    }
  }

  const createNewGrade = async (
    data: Omit<Grade, '$id' | '$createdAt' | '$updatedAt'>
  ) => {
    const response = await fetch('/api/grades', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error('Failed to create grade')
    }
    return response.json()
  }

  const updateExistingGrade = async (gradeId: string, data: Partial<Grade>) => {
    const response = await fetch('/api/grades', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gradeId, ...data }),
    })
    if (!response.ok) {
      throw new Error('Failed to update grade')
    }
    return response.json()
  }

  const deleteExistingGrade = async (gradeId: string) => {
    const response = await fetch('/api/grades', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gradeId }),
    })
    if (!response.ok) {
      throw new Error('Failed to delete grade')
    }
  }

  // Effect hooks
  useEffect(() => {
    fetchCompetitions()
  }, [fetchCompetitions])

  useEffect(() => {
    if (selectedCompetition) {
      fetchGrades(selectedCompetition.$id)
    } else {
      setGrades([])
    }
  }, [selectedCompetition, fetchGrades])

  // Data mutation handlers
  const handleCreateCompetition = async (data: {
    name: string
    year: number
    sourceCompetitionId?: string
  }) => {
    try {
      setError(null)
      const newCompetition = {
        name: data.name,
        year: data.year,
        active: true,
      }

      if (data.sourceCompetitionId) {
        await cloneCompetition(data.sourceCompetitionId, newCompetition)
      } else {
        await createCompetition(newCompetition)
      }
    } catch (err) {
      setError('Failed to create competition')
      console.error(err)
    }
  }

  const createCompetition = async (
    data: Omit<Competition, '$id' | '$createdAt' | '$updatedAt'>
  ) => {
    try {
      setError(null)
      await createNewCompetition(data)
      await fetchCompetitions()
    } catch (err) {
      setError('Failed to create competition')
      console.error(err)
    }
  }

  const cloneCompetition = async (
    sourceCompetitionId: string,
    newData: Partial<Competition>
  ) => {
    try {
      setError(null)
      await cloneExistingCompetition(sourceCompetitionId, newData)
      await fetchCompetitions()
    } catch (err) {
      setError('Failed to clone competition')
      console.error(err)
    }
  }

  const updateCompetition = async (
    competitionId: string,
    data: Partial<Competition>
  ) => {
    try {
      setError(null)
      await updateExistingCompetition(competitionId, data)
      await fetchCompetitions()
    } catch (err) {
      setError('Failed to update competition')
      console.error(err)
    }
  }

  const handleDeleteCompetition = (competition: Competition) => {
    setCompetitionToDelete(competition.$id)
    setCompetitionNameToDelete(competition.name)
    setDeleteCompetitionDialogOpen(true)
  }

  const confirmDeleteCompetition = async () => {
    if (!competitionToDelete) return

    try {
      setError(null)
      await deleteExistingCompetition(competitionToDelete)
      await fetchCompetitions()
      if (selectedCompetition?.$id === competitionToDelete) {
        setSelectedCompetition(null)
        setGrades([])
      }
    } catch (err) {
      setError('Failed to delete competition')
      console.error(err)
    } finally {
      setDeleteCompetitionDialogOpen(false)
      setCompetitionToDelete(null)
    }
  }

  const deleteCompetition = async (competitionId: string) => {
    const competition = competitions.find((c) => c.$id === competitionId)
    if (competition) {
      handleDeleteCompetition(competition)
    }
  }

  const createGrade = async (
    data: Omit<Grade, '$id' | '$createdAt' | '$updatedAt'>
  ) => {
    try {
      setError(null)
      await createNewGrade(data)
      if (selectedCompetition) {
        await fetchGrades(selectedCompetition.$id)
      }
    } catch (err) {
      setError('Failed to create grade')
      console.error(err)
    }
  }

  const updateGrade = async (gradeId: string, data: Partial<Grade>) => {
    try {
      setError(null)
      await updateExistingGrade(gradeId, data)
      if (selectedCompetition) {
        await fetchGrades(selectedCompetition.$id)
      }
    } catch (err) {
      setError('Failed to update grade')
      console.error(err)
    }
  }

  const handleDeleteGrade = (grade: Grade) => {
    setGradeToDelete(grade.$id)
    setGradeNameToDelete(grade.name)
    setDeleteGradeDialogOpen(true)
  }

  const confirmDeleteGrade = async () => {
    if (!gradeToDelete) return

    try {
      setError(null)
      await deleteExistingGrade(gradeToDelete)
      if (selectedCompetition) {
        await fetchGrades(selectedCompetition.$id)
      }
    } catch (err) {
      setError('Failed to delete grade')
      console.error(err)
    } finally {
      setDeleteGradeDialogOpen(false)
      setGradeToDelete(null)
    }
  }

  const deleteGrade = async (gradeId: string) => {
    const grade = grades.find((g) => g.$id === gradeId)
    if (grade) {
      handleDeleteGrade(grade)
    }
  }

  const handleModalClose = () => {
    setShowAppwriteSetup(false)
    fetchCompetitions()
  }

  return (
    <div className="space-y-8">
      <AppwriteSetupModal
        open={showAppwriteSetup}
        onClose={handleModalClose}
        onSwitchTab={onSwitchTab}
      />
      <CreateCompetitionDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        competitions={competitions}
        onCreateCompetition={handleCreateCompetition}
      />

      {/* Competition Delete Confirmation Dialog */}
      <Dialog
        open={deleteCompetitionDialogOpen}
        onOpenChange={setDeleteCompetitionDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the competition &quot;
              {competitionNameToDelete}&quot;? This action cannot be undone and
              will remove all associated grades.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteCompetitionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteCompetition}>
              Delete Competition
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grade Delete Confirmation Dialog */}
      <Dialog
        open={deleteGradeDialogOpen}
        onOpenChange={setDeleteGradeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the grade &quot;
              {gradeNameToDelete}&quot;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteGradeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteGrade}>
              Delete Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Competition Management</h2>
        <div className="space-x-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            Create Competition
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/15 text-destructive p-4 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Competitions List */}
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading competitions...
                  </TableCell>
                </TableRow>
              ) : competitions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No competitions found
                  </TableCell>
                </TableRow>
              ) : (
                competitions.map((competition) => (
                  <TableRow
                    key={competition.$id}
                    className={
                      selectedCompetition?.$id === competition.$id
                        ? 'bg-muted'
                        : ''
                    }
                  >
                    <TableCell>{competition.name}</TableCell>
                    <TableCell>{competition.year}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          competition.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {competition.active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedCompetition(competition)}
                      >
                        Manage Grades
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          updateCompetition(competition.$id, {
                            active: !competition.active,
                          })
                        }
                      >
                        Toggle Active
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteCompetition(competition.$id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Grades List */}
        <div className="border rounded-md">
          <div className="p-4 border-b flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {selectedCompetition
                ? `Grades for ${selectedCompetition.name}`
                : 'Select a competition to manage grades'}
            </h3>
            {selectedCompetition && (
              <Button
                onClick={() => {
                  // TODO: Open create grade modal
                  const mockGrade = {
                    name: 'New Grade',
                    category: 'Singles',
                    segment: 'Short Program',
                    competitionId: selectedCompetition.$id,
                  }
                  createGrade(mockGrade)
                }}
              >
                Add Grade
              </Button>
            )}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Segment</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!selectedCompetition ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Select a competition to view grades
                  </TableCell>
                </TableRow>
              ) : loadingGrades ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading grades...
                  </TableCell>
                </TableRow>
              ) : grades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    No grades found
                  </TableCell>
                </TableRow>
              ) : (
                grades.map((grade) => (
                  <TableRow key={grade.$id}>
                    <TableCell>{grade.name}</TableCell>
                    <TableCell>{grade.category}</TableCell>
                    <TableCell>{grade.segment}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // TODO: Open edit grade modal
                          const mockUpdate = {
                            name: `${grade.name} (updated)`,
                          }
                          updateGrade(grade.$id, mockUpdate)
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteGrade(grade.$id)}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

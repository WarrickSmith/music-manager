'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Pencil, Plus, Trash } from 'lucide-react'
import { toast } from 'sonner'
import {
  getGradesByCompetition,
  deleteGrade,
} from '@/app/actions/grade-actions'
import GradeForm from './grade-form'

interface Competition {
  $id: string
  name: string
  year: number
  active: boolean
}

interface Grade {
  $id: string
  name: string
  category: string
  segment: string
  competitionId: string
}

interface GradeManagementProps {
  competition: Competition
  onCompetitionUpdate: () => void
}

export default function GradeManagement({
  competition,
  onCompetitionUpdate,
}: GradeManagementProps) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null)
  const [selectedNameFilter, setSelectedNameFilter] = useState<string>('all')

  useEffect(() => {
    if (competition) {
      loadGrades()
    }
  }, [competition?.$id])

  const loadGrades = async () => {
    setIsLoading(true)
    try {
      const data = await getGradesByCompetition(competition.$id)
      setGrades(data as unknown as Grade[])
      setSelectedNameFilter('all') // Reset filter when loading new grades
    } catch (error) {
      toast.error(`Failed to load grades: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteGrade = async (gradeId: string) => {
    try {
      await deleteGrade(gradeId)
      toast.success('Grade deleted successfully')
      loadGrades()
      onCompetitionUpdate() // Notify parent component about the change
    } catch (error) {
      toast.error(`Failed to delete grade: ${(error as Error).message}`)
    }
  }

  // Get unique grade names for the filter dropdown
  const uniqueGradeNames = useMemo(() => {
    const names = new Set(grades.map((grade) => grade.name))
    return Array.from(names).sort()
  }, [grades])

  // Filter grades based on selected name
  const filteredGrades = useMemo(() => {
    if (selectedNameFilter === 'all') return grades
    return grades.filter((grade) => grade.name === selectedNameFilter)
  }, [grades, selectedNameFilter])

  return (
    <>
      <Card className="border-indigo-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-semibold text-indigo-700">
              {competition.name} - Grades
            </CardTitle>
            <p className="text-sm text-indigo-500 mt-1">
              {competition.active
                ? 'Active Competition'
                : 'Inactive Competition'}{' '}
              ({competition.year})
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-indigo-500 hover:bg-indigo-600"
          >
            <Plus className="h-4 w-4 mr-2" /> Add Grade
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label
              htmlFor="name-filter"
              className="text-xs text-indigo-600 mb-1 block"
            >
              Filter by Name
            </Label>
            <Select
              value={selectedNameFilter}
              onValueChange={setSelectedNameFilter}
            >
              <SelectTrigger
                id="name-filter"
                className="bg-white border-indigo-100"
              >
                <SelectValue placeholder="Select grade name" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grade Names</SelectItem>
                {uniqueGradeNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-indigo-500">
              Loading grades...
            </div>
          ) : grades.length === 0 ? (
            <div className="py-8 text-center text-indigo-400">
              No grades found for this competition
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="py-8 text-center text-indigo-400">
              No grades match your filter
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-indigo-200">
                  <TableHead className="text-indigo-700">Name</TableHead>
                  <TableHead className="text-indigo-700">Category</TableHead>
                  <TableHead className="text-indigo-700">Segment</TableHead>
                  <TableHead className="text-right text-indigo-700">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGrades.map((grade) => (
                  <TableRow key={grade.$id} className="border-indigo-100">
                    <TableCell className="font-medium text-indigo-700">
                      {grade.name}
                    </TableCell>
                    <TableCell className="text-indigo-600">
                      {grade.category}
                    </TableCell>
                    <TableCell className="text-indigo-600">
                      {grade.segment}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingGrade(grade)}
                          className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Grade</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the &ldquo;
                                {grade.name}&rdquo; grade? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground"
                                onClick={() => handleDeleteGrade(grade.$id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Grade Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-indigo-700">Add New Grade</DialogTitle>
          </DialogHeader>
          <GradeForm
            competitionId={competition.$id}
            onSuccess={() => {
              loadGrades()
              setShowCreateDialog(false)
              toast.success('Grade added successfully')
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Grade Dialog */}
      {editingGrade && (
        <Dialog
          open={!!editingGrade}
          onOpenChange={(open) => !open && setEditingGrade(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-indigo-700">Edit Grade</DialogTitle>
            </DialogHeader>
            <GradeForm
              competitionId={competition.$id}
              grade={editingGrade}
              onSuccess={() => {
                loadGrades()
                setEditingGrade(null)
                toast.success('Grade updated successfully')
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}

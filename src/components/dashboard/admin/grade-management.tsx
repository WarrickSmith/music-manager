'use client'

import { useState, useEffect } from 'react'
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

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-semibold">
              {competition.name} - Grades
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {competition.active
                ? 'Active Competition'
                : 'Inactive Competition'}{' '}
              ({competition.year})
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Add Grade
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center">Loading grades...</div>
          ) : grades.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              No grades found for this competition
            </div>
          ) : (
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
                {grades.map((grade) => (
                  <TableRow key={grade.$id}>
                    <TableCell className="font-medium">{grade.name}</TableCell>
                    <TableCell>{grade.category}</TableCell>
                    <TableCell>{grade.segment}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingGrade(grade)}
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
            <DialogTitle>Add New Grade</DialogTitle>
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
              <DialogTitle>Edit Grade</DialogTitle>
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

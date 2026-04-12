'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Check, Pencil, Plus, Trash, X } from 'lucide-react'
import { toast } from 'sonner'
import LocalLoadingCard from '@/components/ui/local-loading-card'
import {
  getGradesByCompetition,
  createGrade,
  updateGrade,
  deleteGrade,
} from '@/app/actions/grade-actions'

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
  isCompetitionDeleting?: boolean
}

interface EditableGrade {
  $id?: string
  name: string
  category: string
  segment: string
  isNew?: boolean
}

export default function GradeManagement({
  competition,
  onCompetitionUpdate,
  isCompetitionDeleting = false,
}: GradeManagementProps) {
  const [grades, setGrades] = useState<Grade[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingGradeId, setEditingGradeId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditableGrade | null>(null)
  const [selectedNameFilter, setSelectedNameFilter] = useState<string>('all')

  const loadGrades = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await getGradesByCompetition(competition.$id)
      setGrades(data as unknown as Grade[])
      setSelectedNameFilter('all') // Reset filter when loading new grades
      setEditingGradeId(null) // Clear any editing state
      setEditForm(null)
    } catch (error) {
      toast.error(`Failed to load grades: ${(error as Error).message}`)
    } finally {
      setIsLoading(false)
    }
  }, [competition.$id])

  useEffect(() => {
    if (competition) {
      loadGrades()
    }
  }, [competition, loadGrades])

  const handleStartEditing = (grade: Grade | null) => {
    if (grade) {
      setEditingGradeId(grade.$id)
      setEditForm({
        $id: grade.$id,
        name: grade.name,
        category: grade.category,
        segment: grade.segment,
      })
    } else {
      // Creating a new grade (empty row at the top)
      setEditingGradeId('new')
      setEditForm({
        name: '',
        category: '',
        segment: '',
        isNew: true,
      })
    }
  }

  const handleCancelEdit = () => {
    setEditingGradeId(null)
    setEditForm(null)
  }

  const handleSaveGrade = async () => {
    if (!editForm) return

    try {
      if (editForm.isNew) {
        // Create new grade
        await createGrade({
          name: editForm.name,
          category: editForm.category,
          segment: editForm.segment,
          competitionId: competition.$id,
        })
        toast.success('Grade added successfully')
      } else if (editForm.$id) {
        // Update existing grade
        await updateGrade(editForm.$id, {
          name: editForm.name,
          category: editForm.category,
          segment: editForm.segment,
        })
        toast.success('Grade updated successfully')
      }

      loadGrades()
      onCompetitionUpdate() // Notify parent component about the change
    } catch (error) {
      toast.error(`Failed to save grade: ${(error as Error).message}`)
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
    if (selectedNameFilter === 'all') {
      // Filter all grades and apply sorting
      // Sort by name Z-A first, then by category A-Z, then by segment A-Z
      return [...grades].sort((a, b) => {
        // First sort by name Z-A (descending)
        const nameComparison = b.name.localeCompare(a.name)
        if (nameComparison !== 0) return nameComparison

        // If names are the same, sort by category A-Z (ascending)
        const categoryComparison = a.category.localeCompare(b.category)
        if (categoryComparison !== 0) return categoryComparison

        // If categories are the same, sort by segment A-Z (ascending)
        return a.segment.localeCompare(b.segment)
      })
    }

    // When filtering by a specific name, still sort by category and segment
    return grades
      .filter((grade) => grade.name === selectedNameFilter)
      .sort((a, b) => {
        // Sort by category A-Z first
        const categoryComparison = a.category.localeCompare(b.category)
        if (categoryComparison !== 0) return categoryComparison

        // Then by segment A-Z
        return a.segment.localeCompare(b.segment)
      })
  }, [grades, selectedNameFilter])

  // If the competition is being deleted, show a loading state
  if (isCompetitionDeleting) {
    return (
      <Card className="border-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-950/10">
        <CardContent className="p-6">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent dark:border-indigo-300" />
            <p className="font-medium text-indigo-600 dark:text-indigo-200">
              Deleting competition and associated grades...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="border-indigo-100 dark:border-indigo-500/20 dark:bg-indigo-950/10">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-xl font-semibold text-indigo-700 dark:text-indigo-200">
              {competition.name} - Grades
            </CardTitle>
            <p className="mt-1 text-sm text-indigo-500 dark:text-indigo-200/80">
              {competition.active
                ? 'Active Competition'
                : 'Inactive Competition'}{' '}
              ({competition.year})
            </p>
          </div>
          <Button
            onClick={() => handleStartEditing(null)}
            className="bg-indigo-500 hover:bg-indigo-600 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            disabled={editingGradeId !== null || isCompetitionDeleting}
          >
            <Plus className="h-4 w-4 mr-2" /> Add Grade
          </Button>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label
              htmlFor="name-filter"
              className="mb-1 block text-xs font-semibold text-indigo-800 dark:text-indigo-200"
            >
              Filter by Name
            </Label>
            <Select
              value={selectedNameFilter}
              onValueChange={setSelectedNameFilter}
              disabled={editingGradeId !== null || isCompetitionDeleting}
            >
              <SelectTrigger
                id="name-filter"
                className="border-indigo-100 bg-background/80 font-medium text-indigo-800 dark:border-indigo-500/30 dark:bg-background dark:text-indigo-100"
              >
                <SelectValue placeholder="Select grade name" />
              </SelectTrigger>
              <SelectContent className="border-indigo-100 dark:border-indigo-500/30">
                <SelectItem
                  value="all"
                  className="font-medium text-indigo-800 dark:text-indigo-100"
                >
                  All Grade Names
                </SelectItem>
                {uniqueGradeNames.map((name) => (
                  <SelectItem
                    key={name}
                    value={name}
                    className="text-indigo-800 dark:text-indigo-100"
                  >
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <LocalLoadingCard message="Loading grades..." minHeight="300px" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-indigo-200 dark:border-indigo-500/20">
                  <TableHead className="text-indigo-700 dark:text-indigo-200">
                    <div className="flex items-center">
                      Name
                      <span className="ml-2 text-xs text-indigo-500 dark:text-indigo-200/70">
                        (Z-A)
                      </span>
                    </div>
                  </TableHead>
                  <TableHead className="text-indigo-700 dark:text-indigo-200">
                    <div className="flex items-center">
                      Category
                      <span className="ml-2 text-xs text-indigo-500 dark:text-indigo-200/70">
                        (A-Z)
                      </span>
                    </div>
                  </TableHead>
                  <TableHead className="text-indigo-700 dark:text-indigo-200">
                    <div className="flex items-center">
                      Segment
                      <span className="ml-2 text-xs text-indigo-500 dark:text-indigo-200/70">
                        (A-Z)
                      </span>
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-indigo-700 dark:text-indigo-200">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {/* New grade row */}
                {editingGradeId === 'new' && editForm && (
                  <TableRow className="border-indigo-300 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-950/30">
                    <TableCell>
                      <Input
                        placeholder="Grade name"
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm({ ...editForm, name: e.target.value })
                        }
                        className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-500/40 dark:focus-visible:ring-indigo-400"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Category"
                        value={editForm.category}
                        onChange={(e) =>
                          setEditForm({ ...editForm, category: e.target.value })
                        }
                        className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-500/40 dark:focus-visible:ring-indigo-400"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        placeholder="Segment"
                        value={editForm.segment}
                        onChange={(e) =>
                          setEditForm({ ...editForm, segment: e.target.value })
                        }
                        className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-500/40 dark:focus-visible:ring-indigo-400"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleSaveGrade}
                          className="text-green-500 hover:bg-green-50 hover:text-green-700 dark:text-green-300 dark:hover:bg-green-500/10 dark:hover:text-green-200"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleCancelEdit}
                          className="text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-100"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {filteredGrades.length === 0 && editingGradeId !== 'new' ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-6 text-center text-indigo-400 dark:text-indigo-200/70"
                    >
                      {selectedNameFilter === 'all'
                        ? 'No grades found for this competition'
                        : 'No grades match your filter'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredGrades.map((grade) =>
                    editingGradeId === grade.$id && editForm ? (
                      // Editing existing grade row
                      <TableRow
                        key={grade.$id}
                        className="border-indigo-300 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-950/30"
                      >
                        <TableCell>
                          <Input
                            placeholder="Grade name"
                            value={editForm.name}
                            onChange={(e) =>
                              setEditForm({ ...editForm, name: e.target.value })
                            }
                            className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-500/40 dark:focus-visible:ring-indigo-400"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Category"
                            value={editForm.category}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                category: e.target.value,
                              })
                            }
                            className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-500/40 dark:focus-visible:ring-indigo-400"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Segment"
                            value={editForm.segment}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                segment: e.target.value,
                              })
                            }
                            className="border-indigo-300 focus:border-indigo-500 dark:border-indigo-500/40 dark:focus-visible:ring-indigo-400"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleSaveGrade}
                              className="text-green-500 hover:bg-green-50 hover:text-green-700 dark:text-green-300 dark:hover:bg-green-500/10 dark:hover:text-green-200"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={handleCancelEdit}
                              className="text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-slate-100"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      // Normal display row
                      <TableRow
                        key={grade.$id}
                        className="border-indigo-100 dark:border-indigo-500/20"
                      >
                        <TableCell className="font-medium text-indigo-700 dark:text-indigo-100">
                          {grade.name}
                        </TableCell>
                        <TableCell className="text-indigo-600 dark:text-indigo-200/80">
                          {grade.category}
                        </TableCell>
                        <TableCell className="text-indigo-600 dark:text-indigo-200/80">
                          {grade.segment}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleStartEditing(grade)}
                              className="text-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-500/10 dark:hover:text-indigo-100"
                              disabled={
                                editingGradeId !== null || isCompetitionDeleting
                              }
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-destructive"
                                  disabled={
                                    editingGradeId !== null ||
                                    isCompetitionDeleting
                                  }
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Grade
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the &ldquo;
                                    {grade.name}&rdquo; grade? This action
                                    cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-white font-medium hover:bg-red-600"
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
                    )
                  )
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

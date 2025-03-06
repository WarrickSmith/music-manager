'use client'

import { useState, useEffect } from 'react'
import { Models } from 'node-appwrite'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import LoadingOverlay from '@/components/ui/loading-overlay'
import { ProgressIndicator } from '@/components/ui/progress-indicator'
import {
  getActiveCompetitions,
  getGradeCategoriesForCompetition,
  getGradesForCompetition,
} from '@/app/actions/competition-actions'
import { uploadMusicFile } from '@/app/actions/music-file-actions'
import { getUserProfile } from '@/app/actions/user-actions'
import { useUploadProgress } from '@/hooks/useUploadProgress'

// Form validation schema
const formSchema = z.object({
  competitionId: z.string({ required_error: 'Please select a competition' }),
  category: z.string({ required_error: 'Please select a category' }),
  gradeId: z.string({ required_error: 'Please select a grade' }),
  file: z
    .any()
    .refine((value) => value instanceof File, {
      message: 'Please select a file',
    })
    .refine((value) => {
      if (!(value instanceof File)) return false
      return value.size <= 15 * 1024 * 1024
    }, 'File size must be less than 15MB')
    .refine((value) => {
      if (!(value instanceof File)) return false
      const validTypes = [
        'audio/mpeg',
        'audio/wav',
        'audio/x-wav',
        'audio/x-m4a',
        'audio/mp4',
        'audio/aac',
        'audio/x-aac',
      ]
      return validTypes.includes(value.type)
    }, 'File must be an audio file (MP3, WAV, M4A, AAC)'),
})

type FormValues = z.infer<typeof formSchema>

interface Competition extends Models.Document {
  $id: string
  name: string
  year: number
  active: boolean
}

interface Grade extends Models.Document {
  $id: string
  name: string
  category: string
  segment: string
  competitionId: string
}

export default function UploadMusic({ userId }: { userId: string }) {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [userName, setUserName] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const {
    progress,
    status,
    startProgress,
    completeProgress,
    setProcessing,
    setError,
    reset: resetProgress,
  } = useUploadProgress()

  // Initialize form with mode = 'onSubmit' to prevent initial validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      competitionId: '',
      category: '',
      gradeId: '',
      file: undefined,
    },
    mode: 'onSubmit', // Changed from 'all' to 'onSubmit'
    criteriaMode: 'all',
  })

  // Validate form when selectedFile changes
  useEffect(() => {
    if (selectedFile) {
      form.setValue('file', selectedFile)
      form.trigger('file')
    }
  }, [selectedFile, form])

  const { watch, setValue, reset } = form
  const competitionId = watch('competitionId')
  const category = watch('category')

  // Fetch competitions and user info on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [competitionsData, userProfile] = await Promise.all([
          getActiveCompetitions(),
          getUserProfile(userId),
        ])

        setCompetitions(competitionsData as Competition[])
        setUserName(userProfile.name)
      } catch (error) {
        toast.error('Failed to load data')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [userId])

  // Fetch categories when competition changes
  useEffect(() => {
    const fetchCategories = async () => {
      if (!competitionId) {
        setCategories([])
        return
      }

      try {
        setIsLoading(true)
        const categoriesData = await getGradeCategoriesForCompetition(
          competitionId
        )
        setCategories(categoriesData)
        setValue('category', '')
        setValue('gradeId', '')
      } catch (error) {
        toast.error('Failed to load categories')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCategories()
  }, [competitionId, setValue])

  // Fetch grades when category changes
  useEffect(() => {
    const fetchGrades = async () => {
      if (!competitionId || !category) {
        setGrades([])
        return
      }

      try {
        setIsLoading(true)
        const gradesData = await getGradesForCompetition(
          competitionId,
          category
        )
        setGrades(gradesData as Grade[])
        setValue('gradeId', '')
      } catch (error) {
        toast.error('Failed to load grades')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGrades()
  }, [competitionId, category, setValue])

  // Handle form submission
  const onSubmit = async (values: FormValues) => {
    try {
      startProgress()

      // Create form data
      const formData = new FormData()
      formData.append('file', values.file)
      formData.append('competitionId', values.competitionId)
      formData.append('gradeId', values.gradeId)
      formData.append('userId', userId)
      formData.append('userName', userName)

      // After 90% progress, show processing status
      setTimeout(() => {
        if (status === 'uploading') {
          setProcessing()
        }
      }, 2000)

      // Upload the file
      await uploadMusicFile(formData)

      completeProgress()
      toast.success('File uploaded successfully')

      // Reset form and state after a short delay to show completed state
      setTimeout(() => {
        resetProgress()
        reset()
        setSelectedFile(null)
      }, 2000)
    } catch (error) {
      setError()
      toast.error(
        `Upload failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      )
      console.error(error)
    }
  }

  const handleReset = () => {
    resetProgress()
    reset()
    setSelectedFile(null)
  }

  // Debug state changes
  useEffect(() => {
    console.log('Form State Updated:', {
      competitionId: form.getValues('competitionId'),
      category: form.getValues('category'),
      gradeId: form.getValues('gradeId'),
      file: form.getValues('file'),
      selectedFile,
      isValid: form.formState.isValid,
      errors: form.formState.errors,
    })
  }, [form, selectedFile])

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4 text-emerald-500">
        Upload Music
      </h2>

      <Card className="p-6 relative">
        {isLoading && <LoadingOverlay message="Loading..." />}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Competition Selection */}
            <FormField
              control={form.control}
              name="competitionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-500">
                    Competition
                  </FormLabel>
                  <Select
                    disabled={
                      isLoading ||
                      status !== 'idle' ||
                      competitions.length === 0
                    }
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Only trigger validation for the current field
                      form.trigger('competitionId')
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a competition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {competitions.map((competition) => (
                        <SelectItem
                          key={competition.$id}
                          value={competition.$id}
                        >
                          {competition.year} - {competition.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription className="text-emerald-400">
                    Only active competitions are shown
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category Selection */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-500">Category</FormLabel>
                  <Select
                    disabled={
                      isLoading ||
                      status !== 'idle' ||
                      !competitionId ||
                      categories.length === 0
                    }
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Only trigger validation for the current field
                      form.trigger('category')
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Grade Selection */}
            <FormField
              control={form.control}
              name="gradeId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-500">Grade</FormLabel>
                  <Select
                    disabled={
                      isLoading ||
                      status !== 'idle' ||
                      !category ||
                      grades.length === 0
                    }
                    onValueChange={(value) => {
                      field.onChange(value)
                      // Only trigger validation for the current field
                      form.trigger('gradeId')
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a grade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {grades.map((grade) => (
                        <SelectItem key={grade.$id} value={grade.$id}>
                          {grade.name} - {grade.segment}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* File Upload */}
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-500">Music File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="audio/*"
                      disabled={status !== 'idle'}
                      ref={field.ref}
                      name={field.name}
                      onBlur={field.onBlur}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        setSelectedFile(file || null)
                        field.onChange(file || null)
                        // Only validate file when a file is selected
                        if (file) {
                          await form.trigger('file')
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription className="text-emerald-400">
                    Max file size: 15MB. Supported formats: MP3, WAV, M4A, AAC
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Upload Progress */}
            {status !== 'idle' && (
              <div className="space-y-4">
                <ProgressIndicator
                  progress={progress}
                  status={status}
                  showPercentage={true}
                />
                {status === 'error' && (
                  <div className="flex justify-center">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-1/2 bg-black hover:bg-black/90 text-white !cursor-pointer"
                      onClick={handleReset}
                    >
                      Reset Form
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-center">
              <Button
                type="submit"
                disabled={
                  isLoading ||
                  status !== 'idle' ||
                  // Only check if the form has been submitted before using isValid
                  (form.formState.submitCount > 0 && !form.formState.isValid) ||
                  !form.getValues('competitionId') ||
                  !form.getValues('category') ||
                  !form.getValues('gradeId') ||
                  !selectedFile
                }
                onClick={() => {
                  // Trigger validation on all fields before submission
                  form.trigger().then((isValid) => {
                    console.log('Form valid?', isValid)
                    console.log('Form Values:', {
                      competitionId: form.getValues('competitionId'),
                      category: form.getValues('category'),
                      gradeId: form.getValues('gradeId'),
                      file: form.getValues('file'),
                    })
                    console.log('Form State:', {
                      isValid: form.formState.isValid,
                      errors: form.formState.errors,
                    })
                  })
                }}
                variant="default"
                className="w-1/2 !bg-emerald-500 hover:!bg-emerald-600 !cursor-pointer"
              >
                {status === 'idle' ? 'Upload Music File' : 'Uploading...'}
              </Button>
            </div>
          </form>
        </Form>
      </Card>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2 text-emerald-500">
          File Naming Convention
        </h3>
        <p className="text-sm text-emerald-400">
          Your file will be automatically renamed using the following format:
          <code className="block p-2 my-2 bg-gray-100 rounded text-xs">
            [YEAR]-[COMPETITION]-[CATEGORY]-[SEGMENT]-[FIRSTNAME]-[LASTNAME
            INITIAL]
          </code>
          For example: 2024-glanburn-club-comp-junior-free-skate-mary-t.mp3 This
          helps organizers easily identify and manage music files for
          competitions.
        </p>
      </div>
    </div>
  )
}

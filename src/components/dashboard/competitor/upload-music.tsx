'use client'

import { useState, useEffect, useRef } from 'react'
import { Models } from 'node-appwrite'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import * as musicMetadata from 'music-metadata'
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
import { ProgressIndicator } from '@/components/ui/progress-indicator'
import {
  getActiveCompetitions,
  getGradeCategoriesForCompetition,
  getGradesForCompetition,
} from '@/app/actions/competition-actions'
import { uploadMusicFile } from '@/app/actions/music-file-actions'
import { getUserProfile } from '@/app/actions/user-actions'
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { formatDuration } from '@/lib/utils'
import { Upload } from 'lucide-react'

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
  duration: z.number().nullable().optional(),
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileDuration, setFileDuration] = useState<number | null>(null)
  const [extractingMetadata, setExtractingMetadata] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    progress,
    status,
    startProgress,
    completeProgress,
    setProcessing,
    setError,
    reset: resetProgress,
  } = useUploadProgress()

  // Add separate loading states for each select component
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingGrades, setIsLoadingGrades] = useState(false)

  // Initialize form with mode = 'onSubmit' to prevent initial validation
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      competitionId: '',
      category: '',
      gradeId: '',
      file: undefined,
      duration: null,
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
        setIsLoadingCompetitions(true)
        const [competitionsData, userProfile] = await Promise.all([
          getActiveCompetitions(),
          getUserProfile(userId),
        ])

        setCompetitions(competitionsData as Competition[])
        setUserName(userProfile.name)
      } catch (error) {
        toast.error('Failed to load competitions')
        console.error(error)
      } finally {
        setIsLoadingCompetitions(false)
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
        setIsLoadingCategories(true)
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
        setIsLoadingCategories(false)
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
        setIsLoadingGrades(true)
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
        setIsLoadingGrades(false)
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

      // Add duration if available
      if (values.duration !== null && values.duration !== undefined) {
        formData.append('duration', values.duration.toString())
      }

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
        handleReset()
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
    setFileDuration(null)

    // Reset the file input element directly
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
      <h2 className="text-2xl font-semibold mb-4 text-emerald-700">
        Upload Music
      </h2>

      <Card className="p-6 relative">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Competition Selection */}
            <FormField
              control={form.control}
              name="competitionId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-emerald-700">
                    Competition
                  </FormLabel>
                  <div className="relative">
                    <Select
                      disabled={status !== 'idle' || competitions.length === 0}
                      onValueChange={(value) => {
                        field.onChange(value)
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
                    {isLoadingCompetitions && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                  <FormDescription className="text-emerald-600">
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
                  <FormLabel className="text-emerald-700">Category</FormLabel>
                  <div className="relative">
                    <Select
                      disabled={
                        status !== 'idle' ||
                        !competitionId ||
                        categories.length === 0
                      }
                      onValueChange={(value) => {
                        field.onChange(value)
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
                    {isLoadingCategories && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
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
                  <FormLabel className="text-emerald-700">Grade</FormLabel>
                  <div className="relative">
                    <Select
                      disabled={
                        status !== 'idle' || !category || grades.length === 0
                      }
                      onValueChange={(value) => {
                        field.onChange(value)
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
                    {isLoadingGrades && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                        <div className="w-5 h-5 border-2 border-emerald-700 border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
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
                  <FormLabel className="text-emerald-700">Music File</FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept="audio/*"
                      disabled={status !== 'idle' || extractingMetadata}
                      ref={(e) => {
                        field.ref(e)
                        if (fileInputRef) fileInputRef.current = e
                      }}
                      name={field.name}
                      onBlur={field.onBlur}
                      onChange={async (e) => {
                        const file = e.target.files?.[0]
                        setSelectedFile(file || null)
                        field.onChange(file || null)

                        // Extract metadata when file is selected
                        if (file) {
                          try {
                            setExtractingMetadata(true)
                            // Convert the File to ArrayBuffer for music-metadata parsing
                            const buffer = await file.arrayBuffer()
                            console.log(
                              'Successfully converted file to ArrayBuffer:',
                              buffer.byteLength,
                              'bytes'
                            )

                            // Use a different parsing approach based on file type
                            let metadata
                            try {
                              console.log(
                                'Attempting to parse audio metadata...'
                              )
                              metadata = await musicMetadata.parseBuffer(
                                new Uint8Array(buffer),
                                file.type
                              )
                              console.log(
                                'Metadata parsing successful:',
                                JSON.stringify(metadata.format, null, 2)
                              )
                            } catch (parseError) {
                              console.error(
                                'Error during parseBuffer, trying alternate approach:',
                                parseError
                              )
                              // Try without specifying content type as fallback
                              metadata = await musicMetadata.parseBuffer(
                                new Uint8Array(buffer)
                              )
                              console.log(
                                'Fallback metadata parsing successful'
                              )
                            }

                            // Get duration in seconds and round to nearest second
                            if (
                              metadata &&
                              metadata.format &&
                              metadata.format.duration
                            ) {
                              const duration = Math.round(
                                metadata.format.duration
                              )
                              setFileDuration(duration)
                              console.log(
                                `Extracted audio duration: ${duration} seconds (${formatDuration(
                                  duration
                                )})`
                              )

                              // Store duration in a hidden field or form state to be used during submission
                              form.setValue('duration', duration)
                            } else {
                              console.log(
                                'Could not extract duration from metadata:',
                                metadata
                              )
                              setFileDuration(null)
                            }
                          } catch (error) {
                            console.error(
                              'Error extracting audio metadata:',
                              error
                            )
                            setFileDuration(null)
                          } finally {
                            setExtractingMetadata(false)
                          }

                          // Validate file
                          await form.trigger('file')
                        } else {
                          setFileDuration(null)
                        }
                      }}
                    />
                  </FormControl>
                  <div className="space-y-2">
                    <FormDescription className="text-emerald-600">
                      Max file size: 15MB. Supported formats: MP3, WAV, M4A, AAC
                    </FormDescription>

                    {/* Show metadata extraction status and duration */}
                    {extractingMetadata && (
                      <div className="text-sm text-amber-500">
                        Extracting file metadata...
                      </div>
                    )}
                    {fileDuration !== null && selectedFile && (
                      <div className="text-sm text-emerald-800">
                        File duration: {formatDuration(fileDuration)}
                      </div>
                    )}
                  </div>
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
                      className="w-1/2 bg-black hover:bg-black/90 text-white cursor-pointer"
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
                className="w-1/2 !bg-emerald-700 hover:!bg-emerald-800 cursor-pointer flex items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" />
                <span>
                  {status === 'idle' ? 'Upload Music File' : 'Uploading...'}
                </span>
              </Button>
            </div>
          </form>
        </Form>
      </Card>

      <div className="mt-6">
        <h3 className="text-lg font-medium mb-2 text-emerald-700">
          File Naming Convention
        </h3>
        <p className="text-sm text-emerald-600">
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

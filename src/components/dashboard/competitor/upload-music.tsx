'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Models } from 'node-appwrite'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import * as musicMetadata from 'music-metadata'
import { FileAudio, Upload, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
import ErrorNotice from '@/components/ui/error-notice'
import PageHeader from '@/components/layout/page-header'
import {
  getActiveCompetitions,
  getGradeCategoriesForCompetition,
  getGradesForCompetition,
} from '@/app/actions/competition-actions'
import { getUserProfile } from '@/app/actions/user-actions'
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { formatDuration, formatFileSize, cn } from '@/lib/utils'
import { ACCEPTED_AUDIO_TYPES, MAX_UPLOAD_BYTES } from '@/lib/music/constants'

const formSchema = z.object({
  competitionId: z.string({ error: 'Please select a competition' }),
  category: z.string({ error: 'Please select a category' }),
  gradeId: z.string({ error: 'Please select a grade' }),
  file: z
    .any()
    .refine((value) => value instanceof File, {
      message: 'Please select a file',
    })
    .refine(
      (value) => value instanceof File && value.size <= MAX_UPLOAD_BYTES,
      'File size must be less than 15MB',
    )
    .refine(
      (value) =>
        value instanceof File && ACCEPTED_AUDIO_TYPES.includes(value.type),
      'File must be an audio file (MP3, WAV, M4A, AAC)',
    ),
  duration: z.number().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Competition extends Models.DefaultRow {
  $id: string
  name: string
  year: number
  active: boolean
}

interface Grade extends Models.DefaultRow {
  $id: string
  name: string
  category: string
  segment: string
  competitionId: string
}

const describe = (error: unknown) =>
  error instanceof Error ? error.message : String(error)

function SelectSpinner() {
  return (
    <div className="absolute inset-0 flex items-center justify-center rounded-md bg-background/80">
      <div className="size-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}

export default function UploadMusic({ userId }: { userId: string }) {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [userName, setUserName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileDuration, setFileDuration] = useState<number | null>(null)
  const [extractingMetadata, setExtractingMetadata] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {
    status,
    progress,
    loaded,
    total,
    bytesPerSecond,
    failure,
    upload,
    reset: resetProgress,
  } = useUploadProgress()

  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState(true)
  const [isLoadingCategories, setIsLoadingCategories] = useState(false)
  const [isLoadingGrades, setIsLoadingGrades] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      competitionId: '',
      category: '',
      gradeId: '',
      file: undefined,
      duration: null,
    },
    mode: 'onSubmit',
    criteriaMode: 'all',
  })

  const { watch, setValue, reset } = form
  const competitionId = watch('competitionId')
  const category = watch('category')
  const gradeId = watch('gradeId')

  const loadCompetitions = useCallback(async () => {
    setLoadError(null)
    setIsLoadingCompetitions(true)
    try {
      const [competitionsData, userProfile] = await Promise.all([
        getActiveCompetitions(),
        getUserProfile(userId),
      ])
      setCompetitions(competitionsData as Competition[])
      setUserName(userProfile.name)
    } catch (error) {
      console.error('Failed to load competitions:', error)
      setLoadError(describe(error))
    } finally {
      setIsLoadingCompetitions(false)
    }
  }, [userId])

  useEffect(() => {
    loadCompetitions()
  }, [loadCompetitions])

  // Categories depend on the competition
  useEffect(() => {
    const fetchCategories = async () => {
      if (!competitionId) {
        setCategories([])
        return
      }
      try {
        setIsLoadingCategories(true)
        setCategories(await getGradeCategoriesForCompetition(competitionId))
        setValue('category', '')
        setValue('gradeId', '')
      } catch (error) {
        console.error('Failed to load categories:', error)
        toast.error('Failed to load categories', {
          description: describe(error),
        })
      } finally {
        setIsLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [competitionId, setValue])

  // Grades depend on the category
  useEffect(() => {
    const fetchGrades = async () => {
      if (!competitionId || !category) {
        setGrades([])
        return
      }
      try {
        setIsLoadingGrades(true)
        setGrades(
          (await getGradesForCompetition(competitionId, category)) as Grade[],
        )
        setValue('gradeId', '')
      } catch (error) {
        console.error('Failed to load grades:', error)
        toast.error('Failed to load grades', { description: describe(error) })
      } finally {
        setIsLoadingGrades(false)
      }
    }
    fetchGrades()
  }, [competitionId, category, setValue])

  const busy = status === 'uploading' || status === 'processing'

  /** Take a chosen or dropped file and read its length in the browser */
  const handleFile = async (file: File | null) => {
    setSelectedFile(file)
    setFileDuration(null)
    form.setValue('file', file ?? undefined)
    form.setValue('duration', null)
    if (!file) return

    setExtractingMetadata(true)
    try {
      const buffer = new Uint8Array(await file.arrayBuffer())
      let metadata
      try {
        metadata = await musicMetadata.parseBuffer(buffer, file.type)
      } catch {
        metadata = await musicMetadata.parseBuffer(buffer)
      }
      if (metadata.format.duration) {
        const duration = Math.round(metadata.format.duration)
        setFileDuration(duration)
        form.setValue('duration', duration)
      }
    } catch (error) {
      // The server reads the length again if this fails, so this is not fatal
      console.error('Error extracting audio metadata:', error)
    } finally {
      setExtractingMetadata(false)
    }
    await form.trigger('file')
  }

  const handleReset = () => {
    resetProgress()
    reset()
    setSelectedFile(null)
    setFileDuration(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const onSubmit = async (values: FormValues) => {
    const formData = new FormData()
    formData.append('file', values.file)
    formData.append('competitionId', values.competitionId)
    formData.append('gradeId', values.gradeId)
    formData.append('userId', userId)
    formData.append('userName', userName)
    if (values.duration !== null && values.duration !== undefined) {
      formData.append('duration', values.duration.toString())
    }

    try {
      await upload('/api/music/upload', formData)
      toast.success('File uploaded successfully')
      // Leave the finished bar on screen briefly, then clear the form
      setTimeout(handleReset, 2500)
    } catch (error) {
      // The failure is shown in the form; keep the console copy for debugging
      console.error('Upload failed:', error)
    }
  }

  const canSubmit =
    !busy &&
    status !== 'complete' &&
    !!competitionId &&
    !!category &&
    !!gradeId &&
    !!selectedFile &&
    !extractingMetadata

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Upload Music"
        description="Choose the competition and grade, add your file, and watch it go up byte by byte."
      />

      {loadError && (
        <ErrorNotice
          title="Could not load the competitions"
          message="The list of competitions could not be loaded, so you cannot upload yet."
          details={loadError}
          onRetry={loadCompetitions}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="rounded-lg border bg-card p-5">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="competitionId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="label-mono">Competition</FormLabel>
                    <div className="relative">
                      <Select
                        disabled={busy || competitions.length === 0}
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
                      {isLoadingCompetitions && <SelectSpinner />}
                    </div>
                    <FormDescription>
                      Only active competitions are shown
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-mono">Category</FormLabel>
                      <div className="relative">
                        <Select
                          disabled={
                            busy || !competitionId || categories.length === 0
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
                        {isLoadingCategories && <SelectSpinner />}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gradeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="label-mono">Grade</FormLabel>
                      <div className="relative">
                        <Select
                          disabled={busy || !category || grades.length === 0}
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
                        {isLoadingGrades && <SelectSpinner />}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="file"
                render={() => (
                  <FormItem>
                    <FormLabel className="label-mono">Music file</FormLabel>
                    <FormControl>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        className="sr-only"
                        id="music-file-input"
                        disabled={busy}
                        onChange={(e) =>
                          handleFile(e.target.files?.[0] ?? null)
                        }
                      />
                    </FormControl>

                    {selectedFile ? (
                      <div className="flex items-center gap-3 rounded-lg border bg-background p-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent text-accent-foreground">
                          <FileAudio className="size-5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold break-words">
                            {selectedFile.name}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                            {extractingMetadata && ' · reading length...'}
                            {fileDuration !== null &&
                              ` · ${formatDuration(fileDuration)}`}
                          </p>
                        </div>
                        {!busy && status !== 'complete' && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              handleFile(null)
                              if (fileInputRef.current)
                                fileInputRef.current.value = ''
                            }}
                            aria-label="Remove file"
                          >
                            <X />
                          </Button>
                        )}
                      </div>
                    ) : (
                      <label
                        htmlFor="music-file-input"
                        onDragOver={(e) => {
                          e.preventDefault()
                          setIsDragging(true)
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault()
                          setIsDragging(false)
                          if (!busy)
                            handleFile(e.dataTransfer.files?.[0] ?? null)
                        }}
                        className={cn(
                          'flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed bg-background px-4 py-7 text-center text-muted-foreground transition-colors hover:border-primary hover:text-foreground',
                          isDragging && 'border-primary text-foreground',
                        )}
                      >
                        <Upload className="mb-1 size-7 text-primary" />
                        <span className="font-display text-base font-bold text-foreground">
                          Drop your music file here
                        </span>
                        <span>or click to browse your device</span>
                      </label>
                    )}
                    <FormDescription>
                      Max file size: 15MB. Supported formats: MP3, WAV, M4A, AAC
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {status !== 'idle' && status !== 'error' && (
                <ProgressIndicator
                  title={`${status === 'complete' ? 'Uploaded' : 'Uploading'} ${selectedFile?.name ?? ''}`}
                  progress={progress}
                  status={status}
                  loaded={loaded}
                  total={total || selectedFile?.size || 0}
                  bytesPerSecond={bytesPerSecond}
                />
              )}

              {status === 'error' && failure && (
                <div className="space-y-3">
                  <ProgressIndicator
                    title={`Upload of ${selectedFile?.name ?? 'file'} stopped`}
                    progress={progress}
                    status="error"
                    loaded={loaded}
                    total={total || selectedFile?.size || 0}
                    bytesPerSecond={bytesPerSecond}
                  />
                  <ErrorNotice
                    title="The upload did not finish"
                    message={failure.message}
                    details={failure.details}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => form.handleSubmit(onSubmit)()}
                    >
                      <Upload /> Try again
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                    >
                      Start over
                    </Button>
                  </div>
                </div>
              )}

              {status !== 'error' && (
                <Button type="submit" disabled={!canSubmit}>
                  <Upload />
                  {busy
                    ? 'Uploading...'
                    : status === 'complete'
                      ? 'Uploaded'
                      : 'Upload music file'}
                </Button>
              )}
            </form>
          </Form>
        </div>

        <div className="flex flex-col gap-4 self-start rounded-lg border bg-card p-5">
          <h3 className="font-display text-lg font-bold">File naming</h3>
          <p className="text-sm text-muted-foreground">
            Your file is renamed automatically so organisers can find it:
          </p>
          <code className="block rounded-md border bg-background p-2 font-mono text-xs break-words">
            [YEAR]-[COMPETITION]-[CATEGORY]-[SEGMENT]-[FIRSTNAME]-[LASTNAME
            INITIAL]
          </code>
          <p className="text-sm text-muted-foreground">
            For example:{' '}
            <span className="font-mono text-xs break-all text-foreground">
              2024-glanburn-club-comp-junior-free-skate-mary-t.mp3
            </span>
          </p>
        </div>
      </div>
    </div>
  )
}

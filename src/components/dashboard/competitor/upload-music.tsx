'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Models } from 'node-appwrite'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'sonner'
import * as musicMetadata from 'music-metadata'
import { FileAudio, Upload, Wrench, X } from 'lucide-react'
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
import { findExistingMusicFile } from '@/app/actions/music-file-actions'
import type { ExistingMusicSummary } from '@/lib/music/upload-service'
import { deadlineStatus } from '@/lib/deadline'
import {
  analyseLeadingSilence,
  silenceVerdict,
} from '@/lib/audio/leading-silence'
import { useUploadProgress } from '@/hooks/useUploadProgress'
import { UploadError } from '@/lib/upload/xhr-upload'
import { formatDate, formatDuration, formatFileSize, cn } from '@/lib/utils'
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
      'File size must be less than 15MB'
    )
    .refine(
      (value) =>
        value instanceof File && ACCEPTED_AUDIO_TYPES.includes(value.type),
      'File must be an audio file (MP3, WAV, M4A, AAC)'
    ),
  duration: z.number().nullable().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface Competition extends Models.DefaultRow {
  $id: string
  name: string
  year: number
  active: boolean
  uploadDeadline?: string | null
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

/** Advice on how the track starts. Never blocks the upload. */
function SilenceNote({ seconds }: { seconds: number }) {
  const verdict = silenceVerdict(seconds)
  const rounded = seconds.toFixed(1)
  return (
    <p
      className={cn(
        'rounded-md border px-3 py-2 text-sm',
        verdict === 'good'
          ? 'border-success/50 bg-success/10'
          : 'border-warning/60 bg-warning/10'
      )}
      role="status"
    >
      {verdict === 'good' && (
        <>
          <span className="font-semibold">
            Starts with {rounded} s of silence.
          </span>{' '}
          That leaves a clear cue for the rink operator.
        </>
      )}
      {verdict === 'too-short' && (
        <>
          <span className="font-semibold">
            This track starts almost straight away ({rounded} s of silence).
          </span>{' '}
          Clubs usually ask for about 1 second of silence at the start so the
          operator can cue it cleanly. You can still upload it.
        </>
      )}
      {verdict === 'too-long' && (
        <>
          <span className="font-semibold">
            This track starts with {rounded} s of silence.
          </span>{' '}
          That is a long wait on the ice. Check it is intended. You can still
          upload it.
        </>
      )}
    </p>
  )
}

export default function UploadMusic({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  userId,
}: {
  userId: string
}) {
  const [competitions, setCompetitions] = useState<Competition[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileDuration, setFileDuration] = useState<number | null>(null)
  const [extractingMetadata, setExtractingMetadata] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  // Seconds of silence at the start of the chosen file, once measured
  const [leadingSilence, setLeadingSilence] = useState<number | null>(null)
  const chosenFileRef = useRef<File | null>(null)
  // Set when the server found a fault that stops the file playing in some
  // browsers; holds the explanation shown with the offer to fix it
  const [repairOffer, setRepairOffer] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  // The skater's current file for the selected grade; tagged with its grade so a
  // stale answer for an earlier grade is never shown
  const [existingFor, setExistingFor] = useState<{
    gradeId: string
    file: ExistingMusicSummary | null
  } | null>(null)
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
      setCompetitions((await getActiveCompetitions()) as Competition[])
    } catch (error) {
      console.error('Failed to load competitions:', error)
      setLoadError(describe(error))
    } finally {
      setIsLoadingCompetitions(false)
    }
  }, [])

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
          (await getGradesForCompetition(competitionId, category)) as Grade[]
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

  // Look for a file this skater already uploaded for the chosen grade
  useEffect(() => {
    const checkExisting = async () => {
      if (!gradeId) return
      const result = await findExistingMusicFile(gradeId)
      if (result.ok) {
        setExistingFor({ gradeId, file: result.data })
      } else {
        // The server still blocks an accidental overwrite, so this is a warning only
        console.error('Could not check for an existing file:', result.error)
        setExistingFor({ gradeId, file: null })
      }
    }
    checkExisting()
  }, [gradeId])

  const existing = existingFor?.gradeId === gradeId ? existingFor.file : null
  const selectedCompetition = competitions.find((c) => c.$id === competitionId)
  const deadline = deadlineStatus(selectedCompetition?.uploadDeadline)
  const closed = deadline.state === 'closed'

  const busy = status === 'uploading' || status === 'processing'

  /** Take a chosen or dropped file and read its length in the browser */
  const handleFile = async (file: File | null) => {
    setSelectedFile(file)
    setFileDuration(null)
    setLeadingSilence(null)
    setRepairOffer(null)
    chosenFileRef.current = file
    form.setValue('file', file ?? undefined)
    form.setValue('duration', null)
    if (!file) return

    // Measured in the background; the advice appears when it is ready
    analyseLeadingSilence(file).then((seconds) => {
      if (chosenFileRef.current === file) setLeadingSilence(seconds)
    })

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
    setLeadingSilence(null)
    setRepairOffer(null)
    chosenFileRef.current = null
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const submit = async (values: FormValues, repair: boolean) => {
    const formData = new FormData()
    formData.append('file', values.file)
    formData.append('competitionId', values.competitionId)
    formData.append('gradeId', values.gradeId)
    // Tell the server this upload is meant to replace the earlier file
    if (existing) formData.append('replace', 'true')
    // The skater agreed to have a faulty file fixed before it is stored
    if (repair) formData.append('repair', 'true')
    setRepairOffer(null)

    try {
      await upload('/api/music/upload', formData)
      toast.success(existing ? 'Music replaced' : 'File uploaded successfully')
      // Leave the finished bar on screen briefly, then clear the form
      setTimeout(handleReset, 2500)
    } catch (error) {
      // Someone (or another tab) uploaded to this grade since we looked.
      // Show the replace warning and let the skater confirm.
      if (error instanceof UploadError && error.code === 'exists') {
        const found = error.payload?.existing as
          | ExistingMusicSummary
          | undefined
        if (found) setExistingFor({ gradeId: values.gradeId, file: found })
        resetProgress()
        toast.info('You already have a file for this grade. Review it below.')
        return
      }
      // The file would stop part-way through in some browsers. Offer to fix it.
      if (error instanceof UploadError && error.code === 'needs-repair') {
        setRepairOffer(error.message)
        resetProgress()
        return
      }
      // The failure is shown in the form; keep the console copy for debugging
      console.error('Upload failed:', error)
    }
  }

  const onSubmit = (values: FormValues) => submit(values, false)

  const canSubmit =
    !busy &&
    status !== 'complete' &&
    !!competitionId &&
    !!category &&
    !!gradeId &&
    !!selectedFile &&
    !closed &&
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
                              disabled={
                                deadlineStatus(competition.uploadDeadline)
                                  .state === 'closed'
                              }
                            >
                              {competition.year} - {competition.name}
                              {deadlineStatus(competition.uploadDeadline)
                                .state === 'closed' && ' (uploads closed)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isLoadingCompetitions && <SelectSpinner />}
                    </div>
                    <FormDescription>
                      Only active competitions are shown
                    </FormDescription>
                    {selectedCompetition && deadline.state !== 'none' && (
                      <p
                        className={cn(
                          'rounded-md border px-3 py-2 text-sm',
                          deadline.state === 'closed'
                            ? 'border-destructive/50 bg-destructive/10'
                            : deadline.state === 'closing-soon'
                              ? 'border-warning/60 bg-warning/10'
                              : 'bg-background text-muted-foreground'
                        )}
                        role={deadline.state === 'closed' ? 'alert' : undefined}
                      >
                        <span className="font-semibold">{deadline.label}.</span>{' '}
                        {deadline.state === 'closed'
                          ? 'You can no longer upload or change music for this competition. Ask a club admin if something needs to change.'
                          : deadline.state === 'closing-soon'
                            ? 'After this you will not be able to upload, replace or delete your music.'
                            : 'After that you will not be able to upload, replace or delete your music.'}
                      </p>
                    )}
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

              {existing && (
                <div
                  className="rounded-md border border-warning/60 bg-warning/10 px-3 py-2 text-sm"
                  role="status"
                >
                  <p className="font-semibold">
                    You already have a file for this grade.
                  </p>
                  <p className="text-muted-foreground">
                    <span className="font-mono text-foreground">
                      {existing.originalName}
                    </span>
                    {existing.duration
                      ? ` (${formatDuration(existing.duration)})`
                      : ''}
                    {existing.uploadedAt
                      ? `, uploaded ${formatDate(existing.uploadedAt)}`
                      : ''}
                    . Uploading a new file replaces it. The old file is only
                    removed once the new one is saved.
                  </p>
                </div>
              )}

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
                          isDragging && 'border-primary text-foreground'
                        )}
                      >
                        <Upload className="mb-1 size-7 text-primary" />
                        <span className="font-display text-base font-bold text-foreground">
                          Drop your music file here
                        </span>
                        <span>or click to browse your device</span>
                      </label>
                    )}
                    {selectedFile && leadingSilence !== null && (
                      <SilenceNote seconds={leadingSilence} />
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
                    {failure.code !== 'deadline' && (
                      <Button
                        type="button"
                        onClick={() => form.handleSubmit(onSubmit)()}
                      >
                        <Upload /> Try again
                      </Button>
                    )}
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

              {repairOffer && status !== 'error' && (
                <div
                  role="alert"
                  className="space-y-3 rounded-lg border border-warning/60 bg-card p-4"
                >
                  <p className="flex items-center gap-2 font-semibold">
                    <Wrench className="size-4 text-warning" aria-hidden />
                    This file needs a quick fix
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {repairOffer} It plays fine in some players, but could stop
                    part-way through on race day. Fixing takes a few seconds and
                    the sound stays the same. We keep the fixed copy, not the
                    original.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() =>
                        form.handleSubmit((values) => submit(values, true))()
                      }
                    >
                      <Wrench /> Fix and upload
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleReset}
                    >
                      Choose a different file
                    </Button>
                  </div>
                </div>
              )}

              {status !== 'error' && !repairOffer && (
                <Button type="submit" disabled={!canSubmit}>
                  <Upload />
                  {busy
                    ? 'Uploading...'
                    : status === 'complete'
                      ? 'Uploaded'
                      : existing
                        ? 'Replace music file'
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

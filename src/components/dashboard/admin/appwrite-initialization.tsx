'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import ErrorNotice from '@/components/ui/error-notice'
import LocalLoadingCard from '@/components/ui/local-loading-card'
import {
  checkAppwriteInitialization,
  initializeAppwrite,
} from '@/lib/appwrite/initialization-service'
import { buildSetupReport } from '@/lib/appwrite/setup-report'
import type {
  InitializationResult,
  InitializationStatus,
} from '@/lib/appwrite/setup-types'
import { copyText } from '@/lib/error-report'
import SetupStatusView from './setup-status-view'

export type { InitializationStatus }

export default function AppwriteInitialization() {
  const [status, setStatus] = useState<InitializationStatus | null>(null)
  const [checkError, setCheckError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)
  const [lastRun, setLastRun] = useState<InitializationResult | null>(null)
  const [copied, setCopied] = useState(false)

  const checkStatus = useCallback(async () => {
    setIsLoading(true)
    setCheckError(null)
    try {
      setStatus(await checkAppwriteInitialization())
    } catch (error) {
      console.error('Error checking initialization status:', error)
      setCheckError(error instanceof Error ? error.message : String(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const runInitialization = async () => {
    setIsInitializing(true)
    try {
      const result = await initializeAppwrite()
      setLastRun(result)
      if (result.success) {
        toast.success('Setup finished')
      } else {
        toast.error(`Setup failed: ${result.errors?.[0] ?? result.message}`)
        console.error('Initialization errors:', result.errors)
      }
    } catch (error) {
      console.error('Initialization error:', error)
      setLastRun({
        success: false,
        message: 'Failed to initialize Appwrite resources',
        errors: [error instanceof Error ? error.message : String(error)],
      })
      toast.error('Setup failed. See the details on this page.')
    } finally {
      setIsInitializing(false)
      await checkStatus()
    }
  }

  const copyReport = async () => {
    if (!status) return
    const ok = await copyText(buildSetupReport(status, lastRun))
    setCopied(ok)
    if (ok) {
      toast.success('Setup report copied')
      setTimeout(() => setCopied(false), 2500)
    } else {
      toast.error(
        'Could not copy the report. Select the details and copy by hand.',
      )
    }
  }

  if (isLoading && !status) {
    return (
      <LocalLoadingCard
        message="Checking the backend setup..."
        minHeight="240px"
      />
    )
  }

  if (!status) {
    return (
      <ErrorNotice
        title="Could not check the backend setup"
        message="The status check failed. Make sure the Appwrite settings (endpoint, project ID and API key) are set on the server, then try again."
        details={checkError ?? undefined}
        onRetry={checkStatus}
      />
    )
  }

  return (
    <SetupStatusView
      status={status}
      lastRun={lastRun}
      checkError={checkError}
      isLoading={isLoading}
      isInitializing={isInitializing}
      copied={copied}
      onCheck={checkStatus}
      onCopy={copyReport}
      onRun={runInitialization}
    />
  )
}

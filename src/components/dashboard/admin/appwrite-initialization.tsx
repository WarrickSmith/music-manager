'use client'

import { useState, useEffect } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  checkAppwriteInitialization,
  initializeAppwrite,
} from '@/lib/appwrite/initialization-service'
import { toast } from 'sonner'
import { RefreshCw, CheckCircle2, XCircle } from 'lucide-react'

// Creating simple alert components since the import isn't available
const Alert = ({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={`relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

const AlertTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h5
    className={`mb-1 font-medium leading-none tracking-tight ${className}`}
    {...props}
  />
)

const AlertDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={`text-sm opacity-90 ${className}`} {...props} />
)

export interface InitializationStatus {
  isInitialized: boolean
  details: {
    databaseExists: boolean
    musicFilesCollectionExists: boolean
    competitionsCollectionExists: boolean
    storageBucketExists: boolean
  }
}

export default function AppwriteInitialization() {
  const [status, setStatus] = useState<InitializationStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isInitializing, setIsInitializing] = useState(false)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setIsLoading(true)
    try {
      const initStatus = await checkAppwriteInitialization()
      setStatus(initStatus as InitializationStatus)
    } catch (error) {
      toast.error('Failed to check initialization status')
      console.error('Error checking initialization status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const runInitialization = async () => {
    setIsInitializing(true)
    try {
      await initializeAppwrite()
      toast.success('Appwrite initialization successful!')
      await checkStatus()
    } catch (error) {
      toast.error(
        'Initialization failed. Please check the console for more information.'
      )
      console.error('Initialization error:', error)
    } finally {
      setIsInitializing(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-indigo-100">
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="text-indigo-600">
              Checking Appwrite initialization status...
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status?.isInitialized) {
    return (
      <Card className="border-indigo-100">
        <CardHeader>
          <CardTitle className="text-green-600 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Appwrite Initialized
          </CardTitle>
          <CardDescription>
            All required Appwrite resources are properly initialized.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-1 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Database: Available
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Music Files Collection: Available
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Competitions Collection: Available
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Storage Bucket: Available
            </li>
          </ul>
        </CardContent>
        <CardFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={checkStatus}
            className="text-indigo-600"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}
            />
            Refresh Status
          </Button>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="border-indigo-100">
      <CardHeader>
        <CardTitle className="text-amber-600 flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          Appwrite Not Initialized
        </CardTitle>
        <CardDescription>
          Some required Appwrite resources are missing. Please initialize your
          Appwrite backend.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="bg-amber-50 mb-4">
          <AlertTitle>Initialization Required</AlertTitle>
          <AlertDescription>
            The following resources need to be initialized:
            <ul className="mt-2 space-y-1 text-sm">
              {!status?.details.databaseExists && (
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-amber-600" />
                  Database
                </li>
              )}
              {!status?.details.musicFilesCollectionExists && (
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-amber-600" />
                  Music Files Collection
                </li>
              )}
              {!status?.details.competitionsCollectionExists && (
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-amber-600" />
                  Competitions Collection
                </li>
              )}
              {!status?.details.storageBucketExists && (
                <li className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-amber-600" />
                  Storage Bucket
                </li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
        <div className="flex flex-col space-y-4">
          <p className="text-sm text-gray-600">
            Initializing Appwrite will create all necessary database collections
            and storage buckets required for the application to function
            properly.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between flex-wrap gap-2">
        <Button
          onClick={checkStatus}
          variant="outline"
          disabled={isLoading}
          className="text-indigo-600"
        >
          <RefreshCw
            className={`h-4 w-4 mr-1 ${isLoading ? 'animate-spin' : ''}`}
          />
          Refresh Status
        </Button>
        <Button
          onClick={runInitialization}
          className="bg-indigo-600 hover:bg-indigo-700"
          disabled={isInitializing}
        >
          {isInitializing ? (
            <>
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
              Initializing...
            </>
          ) : (
            'Initialize Appwrite'
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}

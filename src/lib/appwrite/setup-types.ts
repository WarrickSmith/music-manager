/** Shapes shared by the setup status service and the Setup screen */

export type SetupState = 'ready' | 'missing' | 'building' | 'error'

/** One thing the app needs: a database, column, index, bucket or team */
export interface SetupItem {
  id: string
  label: string
  /** Short explanation, such as a column's type */
  detail?: string
  state: SetupState
  /** What Appwrite said when the check failed */
  error?: string
}

export interface SetupTable extends SetupItem {
  /** What the table is used for */
  purpose: string
  columns: SetupItem[]
  indexes: SetupItem[]
}

/** The Appwrite settings the app is using. Never includes the API key. */
export interface SetupConfig {
  endpoint: string
  projectId: string
  databaseId: string
  bucketId: string
  tableIds: { competitions: string; grades: string; musicFiles: string }
  apiKeySet: boolean
}

export interface SetupReport {
  /** The settings in use, so a wrong ID in the environment is easy to spot */
  config: SetupConfig
  /** Databases found in the project, listed only when the configured one is missing */
  otherDatabases?: { id: string; name: string }[]
  database: SetupItem
  tables: SetupTable[]
  bucket: SetupItem
  /** Whether the bucket is private. Missing means it is open to the public. */
  bucketAccess: SetupItem
  teams: SetupItem[]
}

export interface InitializationStatus {
  isInitialized: boolean
  details: {
    databaseExists: boolean
    musicFilesCollectionExists: boolean
    competitionsCollectionExists: boolean
    gradesCollectionExists: boolean
    storageBucketExists: boolean
  }
  errors: string[]
  report: SetupReport
}

export interface InitializationResult {
  success: boolean
  message: string
  errors?: string[]
  /** Step-by-step log of what the setup did */
  log?: string[]
}

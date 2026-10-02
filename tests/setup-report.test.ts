import { describe, expect, it } from 'vitest'
import { buildSetupReport, countReady } from '@/lib/appwrite/setup-report'
import type { InitializationStatus } from '@/lib/appwrite/setup-types'

const status: InitializationStatus = {
  isInitialized: false,
  details: {
    databaseExists: true,
    musicFilesCollectionExists: false,
    competitionsCollectionExists: true,
    gradesCollectionExists: true,
    storageBucketExists: true,
  },
  errors: ['teams: missing scopes (["teams.read"])'],
  report: {
    config: {
      endpoint: 'https://appwrite.test/v1',
      projectId: 'proj1',
      databaseId: 'MusicManagerDB',
      bucketId: 'mmfiles',
      tableIds: {
        competitions: 'competitions',
        grades: 'grades',
        musicFiles: 'musicfiles',
      },
      apiKeySet: true,
    },
    otherDatabases: [{ id: 'mm-test', name: 'Music Manager Database' }],
    database: { id: 'MusicManagerDB', label: 'MusicManagerDB', state: 'ready' },
    tables: [
      {
        id: 'grades',
        label: 'grades',
        purpose: 'Grades',
        state: 'missing',
        columns: [
          {
            id: 'name',
            label: 'name',
            detail: 'string(255), required',
            state: 'ready',
          },
          {
            id: 'segment',
            label: 'segment',
            detail: 'string(255), required',
            state: 'missing',
          },
        ],
        indexes: [
          {
            id: 'idx_competition',
            label: 'idx_competition',
            state: 'error',
            error: 'Index failed',
          },
        ],
      },
    ],
    bucket: { id: 'mmfiles', label: 'mmfiles', state: 'ready' },
    teams: [
      {
        id: 'admin',
        label: 'Administrators',
        state: 'error',
        error: 'missing scopes',
      },
    ],
  },
}

describe('countReady', () => {
  it('counts ready items against the total', () => {
    expect(countReady(status.report.tables[0].columns)).toEqual({
      ready: 1,
      total: 2,
    })
  })
})

describe('buildSetupReport', () => {
  it('lists problems and leaves out items that are ready', () => {
    const text = buildSetupReport(status)

    expect(text).toContain('Database: MusicManagerDB: ready')
    expect(text).toContain('Database ID: MusicManagerDB')
    expect(text).toContain('API key set: yes')
    expect(text).toContain('mm-test (Music Manager Database)')
    expect(text).toContain('grades: MISSING (1/2 columns, 0/1 indexes)')
    expect(text).toContain('column segment: MISSING (string(255), required)')
    expect(text).not.toContain('column name')
    expect(text).toContain('index idx_competition: ERROR - Index failed')
    expect(text).toContain('Administrators: ERROR - missing scopes')
    expect(text).toContain('Errors from Appwrite:')
  })

  it('includes the last initialisation outcome and log', () => {
    const text = buildSetupReport(status, {
      success: false,
      message: 'Failed',
      errors: ['missing scopes (["tables.write"])'],
      log: ['Setup started'],
    })

    expect(text).toContain('Last initialisation: FAILED')
    expect(text).toContain('error: missing scopes (["tables.write"])')
    expect(text).toContain('Setup started')
  })

  it('never includes an API key', () => {
    process.env.APPWRITE_API_KEY = 'super-secret-key'
    expect(buildSetupReport(status)).not.toContain('super-secret-key')
  })
})

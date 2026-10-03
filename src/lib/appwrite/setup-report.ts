import type {
  InitializationResult,
  InitializationStatus,
  SetupItem,
  SetupState,
} from './setup-types'

const LABEL: Record<SetupState, string> = {
  ready: 'ready',
  missing: 'MISSING',
  building: 'building',
  error: 'ERROR',
}

/** How many of a list of items are ready */
export function countReady(items: SetupItem[]) {
  return {
    ready: items.filter((item) => item.state === 'ready').length,
    total: items.length,
  }
}

function itemLine(item: SetupItem, indent: string) {
  const parts = [`${indent}${item.label}: ${LABEL[item.state]}`]
  if (item.detail) parts.push(`(${item.detail})`)
  if (item.error) parts.push(`- ${item.error}`)
  return parts.join(' ')
}

/**
 * Plain-text summary of the backend setup that an admin can paste into an
 * email or support request. It lists what exists and what does not, plus any
 * errors, and never includes keys or secrets.
 */
export function buildSetupReport(
  status: InitializationStatus,
  lastRun?: InitializationResult | null
): string {
  const { report } = status
  const lines = [
    'Music Manager backend setup report',
    `Time: ${new Date().toISOString()}`,
    '',
    'Settings in use:',
    `  Endpoint: ${report.config.endpoint}`,
    `  Project ID: ${report.config.projectId}`,
    `  Database ID: ${report.config.databaseId}`,
    `  Storage bucket ID: ${report.config.bucketId}`,
    `  Table IDs: ${report.config.tableIds.competitions}, ${report.config.tableIds.grades}, ${report.config.tableIds.musicFiles}`,
    `  API key set: ${report.config.apiKeySet ? 'yes' : 'NO'}`,
    '',
    `Database: ${itemLine(report.database, '').trim()}`,
  ]
  if (report.otherDatabases?.length) {
    lines.push(
      `  Databases that do exist in this project: ${report.otherDatabases
        .map((db) => `${db.id} (${db.name})`)
        .join(', ')}`
    )
  }
  lines.push('', 'Tables:')

  for (const table of report.tables) {
    const columns = countReady(table.columns)
    const indexes = countReady(table.indexes)
    lines.push(
      `  ${table.id}: ${LABEL[table.state]} (${columns.ready}/${columns.total} columns, ${indexes.ready}/${indexes.total} indexes)`
    )
    if (table.error) lines.push(`    - ${table.error}`)
    for (const column of table.columns.filter((c) => c.state !== 'ready')) {
      lines.push(itemLine(column, '    column '))
    }
    for (const index of table.indexes.filter((i) => i.state !== 'ready')) {
      lines.push(itemLine(index, '    index '))
    }
  }

  lines.push(
    '',
    `Storage bucket: ${itemLine(report.bucket, '').trim()}`,
    itemLine(report.bucketAccess, '  '),
    '',
    'Teams:'
  )
  for (const team of report.teams) lines.push(itemLine(team, '  '))

  if (status.errors.length > 0) {
    lines.push('', 'Errors from Appwrite:')
    for (const error of status.errors) lines.push(`  - ${error}`)
  }

  if (lastRun) {
    lines.push(
      '',
      `Last initialisation: ${lastRun.success ? 'succeeded' : 'FAILED'}`
    )
    for (const error of lastRun.errors ?? []) lines.push(`  error: ${error}`)
    for (const entry of lastRun.log ?? []) lines.push(`  ${entry}`)
  }

  return lines.join('\n')
}

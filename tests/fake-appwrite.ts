/**
 * Minimal in-memory stand-in for the Appwrite services the setup code uses.
 * It mimics the behaviour that matters here: 404s for missing resources,
 * 401s for API keys without a scope, and columns that take a moment to build.
 */

export class AppwriteTestError extends Error {
  constructor(
    message: string,
    public code: number,
    public type = ''
  ) {
    super(message)
  }
}

interface FakeColumn {
  key: string
  type: string
  size?: number
  required: boolean
  xdefault?: unknown
  status: string
  error: string
  pollsUntilAvailable: number
}

interface FakeTable {
  name: string
  permissions: string[]
  columns: Map<string, FakeColumn>
  indexes: Map<string, { key: string; type: string; columns: string[] }>
  rows: Record<string, unknown>[]
}

export interface FakeState {
  databases: Set<string>
  tables: Map<string, FakeTable>
  buckets: Set<string>
  teams: { $id: string; name: string }[]
  /** Scopes the fake API key lacks, e.g. ['tables.read'] */
  missingScopes: Set<string>
  /** Number of listColumns calls a new column stays in "processing" */
  columnBuildPolls: number
  /** Column keys that should fail to build */
  failingColumns: Set<string>
  calls: string[]
}

export function createFakeState(): FakeState {
  return {
    databases: new Set(),
    tables: new Map(),
    buckets: new Set(),
    teams: [],
    missingScopes: new Set(),
    columnBuildPolls: 1,
    failingColumns: new Set(),
    calls: [],
  }
}

const notFound = (what: string) =>
  new AppwriteTestError(`${what} not found`, 404)

function requireScope(state: FakeState, scope: string) {
  if (state.missingScopes.has(scope)) {
    throw new AppwriteTestError(
      `app.test@service.example.com (role: applications) missing scopes (["${scope}"])`,
      401,
      'general_unauthorized_scope'
    )
  }
}

const tableKey = (databaseId: string, tableId: string) =>
  `${databaseId}/${tableId}`

export function createFakeTablesDB(state: FakeState) {
  const getTableOrThrow = (databaseId: string, tableId: string) => {
    const table = state.tables.get(tableKey(databaseId, tableId))
    if (!table) throw notFound(`Table ${tableId}`)
    return table
  }

  const addColumn =
    (type: string) =>
    async (params: {
      databaseId: string
      tableId: string
      key: string
      size?: number
      required: boolean
      xdefault?: unknown
    }) => {
      state.calls.push(`create:${type}:${params.tableId}.${params.key}`)
      requireScope(state, 'tables.write')
      const table = getTableOrThrow(params.databaseId, params.tableId)
      if (table.columns.has(params.key)) {
        throw new AppwriteTestError('Column already exists', 409)
      }
      table.columns.set(params.key, {
        key: params.key,
        type,
        size: params.size,
        required: params.required,
        xdefault: params.xdefault,
        status: 'processing',
        error: '',
        pollsUntilAvailable: state.columnBuildPolls,
      })
      return { key: params.key }
    }

  return {
    async get({ databaseId }: { databaseId: string }) {
      state.calls.push('get')
      requireScope(state, 'databases.read')
      if (!state.databases.has(databaseId)) throw notFound('Database')
      return { $id: databaseId }
    },
    async list() {
      requireScope(state, 'databases.read')
      const databases = [...state.databases].map((id) => ({ $id: id, name: id }))
      return { total: databases.length, databases }
    },
    async create({ databaseId }: { databaseId: string; name: string }) {
      state.calls.push('create')
      requireScope(state, 'databases.write')
      state.databases.add(databaseId)
      return { $id: databaseId }
    },
    async getTable({
      databaseId,
      tableId,
    }: {
      databaseId: string
      tableId: string
    }) {
      state.calls.push(`getTable:${tableId}`)
      requireScope(state, 'tables.read')
      getTableOrThrow(databaseId, tableId)
      return { $id: tableId }
    },
    async createTable(params: {
      databaseId: string
      tableId: string
      name: string
      permissions?: string[]
    }) {
      state.calls.push(`createTable:${params.tableId}`)
      requireScope(state, 'tables.write')
      if (!state.databases.has(params.databaseId)) throw notFound('Database')
      state.tables.set(tableKey(params.databaseId, params.tableId), {
        name: params.name,
        permissions: params.permissions ?? [],
        columns: new Map(),
        indexes: new Map(),
        rows: [],
      })
      return { $id: params.tableId }
    },
    async listColumns({
      databaseId,
      tableId,
    }: {
      databaseId: string
      tableId: string
    }) {
      requireScope(state, 'tables.read')
      const table = getTableOrThrow(databaseId, tableId)
      // Each poll moves processing columns one step closer to available
      for (const column of table.columns.values()) {
        if (column.status !== 'processing') continue
        if (state.failingColumns.has(column.key)) {
          column.status = 'failed'
          column.error = 'Simulated build failure'
        } else if (column.pollsUntilAvailable <= 0) {
          column.status = 'available'
        } else {
          column.pollsUntilAvailable--
        }
      }
      const columns = [...table.columns.values()].map((column) => ({
        ...column,
      }))
      return { total: columns.length, columns }
    },
    createVarcharColumn: addColumn('varchar'),
    createStringColumn: addColumn('string'),
    createIntegerColumn: addColumn('integer'),
    createBooleanColumn: addColumn('boolean'),
    createFloatColumn: addColumn('float'),
    createDatetimeColumn: addColumn('datetime'),
    async listRows({
      databaseId,
      tableId,
      queries,
    }: {
      databaseId: string
      tableId: string
      queries?: string[]
    }) {
      requireScope(state, 'rows.read')
      const table = getTableOrThrow(databaseId, tableId)
      const rows = applyQueries(table.rows, queries)
      return { total: table.rows.length, rows }
    },
    async listIndexes({
      databaseId,
      tableId,
    }: {
      databaseId: string
      tableId: string
    }) {
      requireScope(state, 'tables.read')
      const table = getTableOrThrow(databaseId, tableId)
      const indexes = [...table.indexes.values()]
      return { total: indexes.length, indexes }
    },
    async createIndex(params: {
      databaseId: string
      tableId: string
      key: string
      type: string
      columns: string[]
    }) {
      state.calls.push(`createIndex:${params.tableId}.${params.key}`)
      requireScope(state, 'tables.write')
      const table = getTableOrThrow(params.databaseId, params.tableId)
      for (const column of params.columns) {
        if (table.columns.get(column)?.status !== 'available') {
          throw new AppwriteTestError(`Column ${column} not available`, 400)
        }
      }
      table.indexes.set(params.key, {
        key: params.key,
        type: params.type,
        columns: params.columns,
      })
      return { key: params.key }
    },
  }
}

/**
 * Apply the subset of Appwrite queries the app uses. Like Appwrite, results
 * are capped at 25 rows unless a limit is given.
 */
function applyQueries(rows: Record<string, unknown>[], queries: string[] = []) {
  let limit = 25
  let offset = 0
  let result = [...rows]
  for (const raw of queries) {
    const query = JSON.parse(raw) as {
      method: string
      attribute?: string
      values?: unknown[]
    }
    if (query.method === 'equal') {
      result = result.filter((row) =>
        query.values!.includes(row[query.attribute!])
      )
    } else if (query.method === 'limit') {
      limit = query.values![0] as number
    } else if (query.method === 'offset') {
      offset = query.values![0] as number
    }
  }
  return result.slice(offset, offset + limit)
}

export function createFakeStorage(state: FakeState) {
  return {
    async getBucket(bucketId: string) {
      requireScope(state, 'buckets.read')
      if (!state.buckets.has(bucketId)) throw notFound('Bucket')
      return { $id: bucketId }
    },
    async createBucket(bucketId: string) {
      requireScope(state, 'buckets.write')
      state.buckets.add(bucketId)
      return { $id: bucketId }
    },
    async updateBucket(bucketId: string) {
      requireScope(state, 'buckets.write')
      return { $id: bucketId }
    },
  }
}

export function createFakeTeams(state: FakeState) {
  return {
    async list() {
      requireScope(state, 'teams.read')
      return { total: state.teams.length, teams: state.teams }
    },
    async create(teamId: string, name: string) {
      requireScope(state, 'teams.write')
      state.teams.push({ $id: teamId, name })
      return { $id: teamId, name }
    },
  }
}

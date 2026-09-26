# Appwrite Server Node.js API — TablesDB

Reference for the `TablesDB` service in the `node-appwrite` SDK, covering the calls Music Manager uses. TablesDB replaced the legacy `Databases` service (collections, attributes, documents) in Appwrite 1.8. The app must not use the legacy service: its endpoints need the deprecated `collections.*` / `documents.*` API key scopes, which keys created on newer Appwrite servers don't have. `tests/no-legacy-databases-api.test.ts` enforces this.

Full reference: https://appwrite.io/docs/references/cloud/server-nodejs/tablesDB

## Terminology

| Legacy Databases API | TablesDB API |
|---|---|
| Collection | Table |
| Attribute | Column |
| Document | Row |
| `collectionId` | `tableId` |
| `documentId` | `rowId` |
| `response.documents` | `response.rows` |
| `Models.DefaultDocument` | `Models.DefaultRow` |
| Scopes `collections.*`, `attributes.*`, `documents.*` | Scopes `tables.*`, `columns.*`, `rows.*` |

## Initial Setup

In the app, use the shared lazy client from `src/lib/appwrite/server.ts`:

```typescript
import { tablesDB, ID, Query } from '@/lib/appwrite/server'
```

Standalone:

```typescript
import { Client, TablesDB } from 'node-appwrite'

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT!)
  .setProject(process.env.APPWRITE_PROJECT_ID!)
  .setKey(process.env.APPWRITE_API_KEY!)

const tablesDB = new TablesDB(client)
```

All examples use the object-parameter style. The positional style still works but is deprecated in the SDK.

## Databases

```typescript
await tablesDB.get({ databaseId })
await tablesDB.create({ databaseId, name: 'Music Manager Database' })
```

Scopes: `databases.read`, `databases.write`

## Tables

```typescript
await tablesDB.getTable({ databaseId, tableId })

await tablesDB.createTable({
  databaseId,
  tableId,
  name: 'Competitions Collection',
  permissions: [Permission.read(Role.team('admin'))],
})
```

Scopes: `tables.read`, `tables.write`

## Columns

```typescript
const { columns } = await tablesDB.listColumns({ databaseId, tableId })

// Short text. createStringColumn is deprecated since Appwrite 1.9;
// use createVarcharColumn (or createTextColumn for long text).
await tablesDB.createVarcharColumn({
  databaseId,
  tableId,
  key: 'name',
  size: 255,
  required: true,
})

await tablesDB.createIntegerColumn({ databaseId, tableId, key: 'year', required: true })
await tablesDB.createBooleanColumn({ databaseId, tableId, key: 'active', required: true })
await tablesDB.createFloatColumn({ databaseId, tableId, key: 'score', required: false })
await tablesDB.createDatetimeColumn({ databaseId, tableId, key: 'at', required: false })
```

Columns are built asynchronously. Each column's `status` is `processing` until it becomes `available` (or `failed` / `stuck`, with the reason in `error`). Wait for `available` before creating indexes on the column or writing rows that use it; `scripts/setup-appwrite.ts` does this in `waitForColumns()`.

Scopes: `columns.read`, `columns.write`

## Indexes

```typescript
import { TablesDBIndexType } from 'node-appwrite'

const { indexes } = await tablesDB.listIndexes({ databaseId, tableId })

await tablesDB.createIndex({
  databaseId,
  tableId,
  key: 'idx_competition',
  type: TablesDBIndexType.Key, // Key | Unique | Fulltext | Spatial
  columns: ['competitionId'],
})
```

Scopes: `indexes.read`, `indexes.write`

## Rows

```typescript
const { rows, total } = await tablesDB.listRows({
  databaseId,
  tableId,
  queries: [Query.equal('competitionId', id), Query.limit(100), Query.offset(0)],
})

const row = await tablesDB.getRow({ databaseId, tableId, rowId })

const created = await tablesDB.createRow({
  databaseId,
  tableId,
  rowId: ID.unique(),
  data: { name: 'Singles', competitionId: id },
})

await tablesDB.updateRow({ databaseId, tableId, rowId, data: { active: false } })

await tablesDB.deleteRow({ databaseId, tableId, rowId })
```

`listRows` returns at most 100 rows per call. Page with `Query.limit` / `Query.offset` (see `getAllDocuments()` in `src/app/actions/competition-actions.ts`).

Scopes: `rows.read`, `rows.write`

## Error Handling

The SDK throws `AppwriteException` with `code`, `type` and `message`:

| Code | Typical cause |
|---|---|
| 404 | Resource doesn't exist (setup creates it) |
| 409 | Resource already exists or is still being created |
| 401 `general_unauthorized_scope` | API key is missing a scope; the message names it, e.g. `missing scopes (["tables.read"])` |

```typescript
try {
  await tablesDB.getTable({ databaseId, tableId })
} catch (error) {
  if ((error as AppwriteException).code === 404) {
    // create it
  } else {
    throw error // don't treat permission errors as "missing"
  }
}
```

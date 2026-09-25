# Music Manager — Development Guide

> **Generated:** 2026-04-12

## Prerequisites

- **Node.js** 24+ (uses node:24-alpine in Docker)
- **npm** (package-lock.json used for dependency resolution)
- **Appwrite instance** (self-hosted or cloud) with:
  - A project created
  - An API key with full permissions

## Environment Setup

### 1. Clone and Install

```bash
git clone <repository-url>
cd music-manager
npm install
```

### 2. Environment Variables

Create `.env.local` for local development:

```env
APPWRITE_ENDPOINT=https://your-appwrite-instance/v1
APPWRITE_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id
APPWRITE_COMPETITIONS_COLLECTION_ID=competitions
APPWRITE_GRADES_COLLECTION_ID=grades
APPWRITE_MUSIC_FILES_COLLECTION_ID=musicfiles
APPWRITE_BUCKET_ID=mmfiles
```

For Docker/Portainer deployments, use `.env` instead of `.env.local`.

### 3. Appwrite Setup

The Appwrite database, tables, storage bucket, indexes and teams can be provisioned via setup scripts. They use the TablesDB API, so the API key needs the scopes listed in the [deployment guide](deployment-guide.md#api-key-scopes).

```bash
# Full setup (database + tables + storage + teams + indexes)
npm run setup:appwrite

# Individual components
npm run setup:appwrite:db          # Database only
npm run setup:appwrite:tables      # Tables and columns only
npm run setup:appwrite:storage     # Storage bucket only
npm run setup:appwrite:indexes     # Table indexes only
npm run setup:appwrite:teams       # Teams setup
```

Alternatively, the admin dashboard provides an **in-app initialisation UI** that runs the same setup when Appwrite resources are missing.

## Development Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with Turbopack |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | ESLint check on `src/` |

The dev server runs at `http://localhost:3000` by default.

## Project Conventions

### Code Style

- **TypeScript** strict mode enabled
- **ESLint 9** flat config with `eslint-config-next`
- **Functional programming approach:** React hooks, pure functions, immutable state
- **No REST API routes** — all backend logic via Server Actions
- **Server-side only** Appwrite SDK — API key never exposed to client

### File Organisation

- Server Actions → `src/app/actions/`
- Page components → `src/app/{route}/page.tsx`
- Feature components → `src/components/dashboard/{admin|competitor}/`
- UI primitives → `src/components/ui/` (shadcn/ui managed)
- Shared utilities → `src/lib/`
- Custom hooks → `src/hooks/`

### Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Configuration is in `components.json` (new-york style, RSC enabled, Lucide icons).

### Path Aliases

`@/*` maps to `./src/*` (configured in `tsconfig.json`).

## Branching Strategy

| Branch | Purpose |
|---|---|
| `main` | Production — triggers CI/CD image build |
| `dev` | Development integration |
| `feature/*` | Feature branches |
| `feat/*` | Feature branches (alternate prefix) |

## Testing

Unit tests use [Vitest](https://vitest.dev) and live in `tests/`:

```bash
npm test
```

They cover the Appwrite setup script and initialisation status check against an in-memory fake of Appwrite (`tests/fake-appwrite.ts`), including missing API key scopes and columns that are still building. A guard test also fails if any code uses the deprecated Databases API (`listDocuments`, `createCollection`, etc.) instead of TablesDB. UI flows are still verified manually.

## Useful Patterns

### Server→Client Serialisation

Appwrite SDK returns class instances that can't cross the Server→Client Component boundary in Next.js 16. Always wrap return values with `toPlainObject()`:

```typescript
import { toPlainObject } from '@/lib/utils'

export async function getCompetitions() {
  const response = await tablesDB.listRows({ databaseId, tableId, queries })
  return toPlainObject(response.rows)
}
```

### Appwrite Pagination

Appwrite limits queries to 100 documents. Use the `getAllDocuments()` utility for unbounded queries:

```typescript
const allDocs = await getAllDocuments(databaseId, collectionId, [
  Query.equal('competitionId', id),
])
```

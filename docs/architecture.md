# Music Manager — Architecture

> **Generated:** 2026-04-12

## Architecture Pattern

**Full-stack monolith** using the Next.js App Router. All backend logic runs as **Server Actions** — there are no REST API routes. The Appwrite Node.js SDK (server-side only) handles database operations, file storage, and user management. The client never talks to Appwrite directly.

```
┌──────────────────────────────────────��──────────────┐
│                     Browser                         │
│   React Server Components + Client Components       │
│         (shadcn/ui, Tailwind CSS 4)                 │
└─────────────────┬──────────────────────────���────────┘
                  │ Server Actions (form submissions, RPC)
                  ▼
┌──────────────────────────────────��──────────────────┐
│               Next.js Server (Node.js)              │
│                                                     │
│  src/app/actions/     Server Action modules          │
│  src/lib/auth/        Session & auth logic           │
│  src/lib/appwrite/    SDK client, init service       │
└─────────────────┬───────────────────────────────────┘
                  │ node-appwrite SDK (API key auth)
                  ▼
┌─────────────────────────────────────────────────────┐
│              Appwrite Instance                       │
│                                                     │
│  Database: MusicManagerDB                            │
│    ├── competitions                                  │
│    ├── grades                                        │
│    └── musicfiles                                    │
│                                                     │
│  Storage: mmfiles bucket                             │
│  Users: Labels-based roles (admin, competitor)       │
└─────────────────────────────────────────────────────┘
```

## Server Actions Architecture

All data mutations and queries are implemented as `'use server'` actions in `src/app/actions/`. This eliminates the need for API routes and keeps the Appwrite API key strictly server-side.

| Action Module | Responsibility |
|---|---|
| `auth-actions.ts` | Login, register, logout |
| `competition-actions.ts` | Competition CRUD, grade queries, active competition filtering |
| `grade-actions.ts` | Grade CRUD within competitions |
| `music-file-actions.ts` | File upload/delete, download/stream URL generation |
| `user-actions.ts` | User listing, role/status management, profile CRUD, password change |

## Authentication Flow

1. User submits login form → `loginAction` server action
2. Server creates Appwrite email/password session via `Account.createEmailPasswordSession()`
3. Session secret stored in `mm-session` HttpOnly cookie (1 week TTL)
4. On subsequent requests, `getCurrentUser()` reads cookie → creates session-scoped Appwrite client → verifies session → returns user object (serialised to plain JSON for Server→Client boundary)
5. Role determined from Appwrite user labels (`admin` or `competitor`)
6. First registered user automatically gets `admin` role; subsequent users get `competitor`

## Appwrite SDK Setup

The SDK is initialised in `src/lib/appwrite/server.ts` using a **lazy proxy pattern**:

- Admin client: uses API key for privileged operations (CRUD on any resource)
- Project client: used for session-scoped operations (user login/logout)
- Services (`databases`, `storage`, `users`) are exported as lazy proxies that defer client creation until first access
- Environment variables: `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, `APPWRITE_API_KEY`

## Routing Structure

```
src/app/
├── layout.tsx              # Root layout (auth check, theme, navbar, toaster)
├── page.tsx                # Landing page
├── globals.css             # Tailwind CSS 4 theme (light/dark with oklch)
├── (auth)/                 # Auth route group
│   ├── layout.tsx          # Auth layout
│   ├── login/page.tsx      # Login form
│   └── register/page.tsx   # Registration form
├── admin/
│   └── dashboard/
│       ├── layout.tsx      # Admin dashboard layout
│       └── page.tsx        # Admin dashboard (tabs: competitions, users, music, profile)
├── dashboard/
│   ├── layout.tsx          # Competitor dashboard layout
│   └── page.tsx            # Competitor dashboard (tabs: my files, upload, profile)
└── actions/                # Server Actions
```

## Data Flow

### Music File Upload

1. Competitor selects competition → category → segment (cascading dropdowns)
2. Client reads audio duration via Web Audio API, sends as form data
3. Server action receives `FormData` with file + metadata
4. Server validates file type (audio/mpeg, audio/wav, audio/x-m4a, audio/mp4, audio/aac)
5. Server extracts audio duration via `music-metadata` (fallback if client duration unavailable)
6. Server fetches competition/grade details for denormalised naming
7. File renamed to standardised format: `{year}-{competition}-{category}-{segment}-{firstname}-{lastinitial}.{ext}`
8. File uploaded to Appwrite Storage bucket
9. Metadata document created in `musicfiles` collection (denormalised fields for query performance)

### Competition/Grade Management

- Creating a competition optionally seeds grades from either the default template (`default-grades.ts` — NZ ice skating structure) or clones grades from an existing competition
- Deleting a competition cascades: deletes all associated music files (storage + DB records) and grades
- Pagination utility (`getAllDocuments`) handles Appwrite's 100-document limit

## Appwrite Initialisation

The app includes an **in-app initialisation flow** (`src/lib/appwrite/initialization-service.ts`):

- `checkAppwriteInitialization()`: checks if the database, tables (competitions, grades, music files) and storage bucket exist, and reports Appwrite errors such as missing API key scopes separately from missing resources
- `initializeAppwrite()`: runs the `setup-appwrite.ts` script to create all Appwrite resources via the TablesDB API, and returns any errors to the UI instead of throwing
- Admin dashboard shows an initialisation UI when resources are missing
- This allows the Docker image to bootstrap its own Appwrite resources on first run

## Theming

- Light/dark mode with cookie persistence (`mm-theme`)
- Default theme: dark
- CSS variables use oklch colour space (Tailwind CSS 4)
- Custom gradient backgrounds per theme in `globals.css`
- Theme toggle in navbar

## Key Design Decisions

1. **Server-side only Appwrite SDK** — API key never exposed to client, all operations via Server Actions
2. **Denormalised data in MusicFiles** — competition name/year, grade details, and user name stored alongside file records to avoid joins
3. **Lazy proxy for SDK services** — defers Appwrite client creation until first use, avoids startup errors when env vars are missing
4. **`toPlainObject()` serialisation** — strips Appwrite SDK class prototypes so objects can cross the Next.js Server→Client Component boundary
5. **Standalone Docker output** — `output: 'standalone'` in Next.js config for minimal Docker images
6. **`force-dynamic` rendering** — all routes dynamically rendered (auth state varies per request)

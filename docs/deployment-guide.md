# Music Manager — Deployment Guide

> **Generated:** 2026-04-12

## Deployment Architecture

```
GitHub (main branch push)
  │
  ▼
GitHub Actions Workflow
  │ Build Docker image
  │ Push to private registry
  ▼
Zot Registry (registry.wsapz.com)
  │
  ▼
Portainer (pulls image, deploys stack)
  │
  ▼
Docker Container (port 3333 → 3000)
```

## CI/CD Pipeline

**Workflow:** `.github/workflows/publish-image.yml`

**Triggers:**
- Push to `main` branch
- Manual dispatch (`workflow_dispatch`)

**Concurrency:** Only one build runs at a time (`build-and-publish-main` group, cancels in-progress)

**Steps:**
1. Checkout repository
2. Set up Docker Buildx
3. Log in to private Zot registry (`registry.wsapz.com`)
4. Build and push image with GitHub Actions cache

**Image tag:** `registry.wsapz.com/music-manager:latest`

**Required secret:** `REGISTRY_PASSWORD` (repository secret for Zot login)

## Docker Build

**Base image:** `node:24-alpine`

**Multi-stage build:**

| Stage | Purpose |
|---|---|
| `deps` | Install npm dependencies (`npm ci`) |
| `builder` | Copy source + node_modules, run `npm run build` |
| `runner` | Production image with standalone output only |

**Key details:**
- Next.js `output: 'standalone'` produces a self-contained server
- Only `.next/standalone` and `.next/static` are copied to the runner stage
- Runs as non-root user `nextjs` (UID 1001)
- Exposes port 3000
- Telemetry disabled (`NEXT_TELEMETRY_DISABLED=1`)

## Docker Compose / Portainer Stack

**File:** `docker-compose.yml`

```yaml
services:
  music-manager:
    image: registry.wsapz.com/music-manager:latest
    ports:
      - '3333:3000'
    environment:
      # All config via environment variables
```

**Deployment modes:**
- **Local Docker:** `docker compose up -d`
- **Portainer:** Import the project `.env` file into the stack variables, then deploy

**Health check:** HTTP fetch to `http://localhost:3000` every 30s (10s timeout, 3 retries, 40s start period)

## Environment Variables

All runtime configuration is provided via environment variables (no build-time env vars needed):

| Variable | Required | Description |
|---|---|---|
| `NODE_ENV` | No | Defaults to `production` |
| `APPWRITE_ENDPOINT` | Yes | Appwrite API endpoint (e.g., `https://appwrite.example.com/v1`) |
| `APPWRITE_PROJECT_ID` | Yes | Appwrite project ID |
| `APPWRITE_API_KEY` | Yes | Appwrite server API key with the scopes listed under [API Key Scopes](#api-key-scopes) |
| `APPWRITE_DATABASE_ID` | Yes | Appwrite database ID |
| `APPWRITE_COMPETITIONS_COLLECTION_ID` | Yes | Competitions table ID (setup defaults to `competitions`) |
| `APPWRITE_GRADES_COLLECTION_ID` | Yes | Grades table ID (setup defaults to `grades`) |
| `APPWRITE_MUSIC_FILES_COLLECTION_ID` | Yes | Music files table ID (setup defaults to `musicfiles`) |
| `APPWRITE_ENTRIES_COLLECTION_ID` | No | Entries table ID (defaults to `entries`) |
| `APPWRITE_BUCKET_ID` | Yes | Storage bucket ID |

The `*_COLLECTION_ID` names predate Appwrite's switch from "collections" to "tables" and are kept so existing stack `.env` files keep working.

## API Key Scopes

The app uses Appwrite's **TablesDB** API (Appwrite 1.8+). Create the project API key with these scopes:

| Area | Scopes |
|---|---|
| Databases | `databases.read`, `databases.write`, `tables.read`, `tables.write`, `columns.read`, `columns.write`, `indexes.read`, `indexes.write`, `rows.read`, `rows.write` |
| Storage | `buckets.read`, `buckets.write`, `files.read`, `files.write` |
| Users & teams | `users.read`, `users.write`, `teams.read`, `teams.write` |

The legacy `collections.*`, `attributes.*` and `documents.*` scopes are **not** needed. They are deprecated in Appwrite 1.8+ and new keys created in the console don't include them. Older versions of this app used the legacy Databases API and failed with `missing scopes (["collections.read"])` against keys created on newer Appwrite servers.

## First Run

On first deployment, the Appwrite database/collections/storage may not exist yet. The application handles this gracefully:

1. The admin dashboard detects missing Appwrite resources via `checkAppwriteInitialization()`
2. An initialisation UI is displayed to the admin user
3. Clicking "Initialize" runs the `setup-appwrite.ts` script within the app runtime
4. This creates the database, tables (with columns and permissions), storage bucket, teams and indexes. It waits for Appwrite to finish building columns before creating indexes, and is safe to run again.

   The Docker image includes `ffmpeg`, which checks uploaded audio and repairs files that browsers cannot play. If you run the app without Docker, install `ffmpeg` too (uploads still work without it, only the check is skipped).

   The storage bucket is **private**: it has no read permission for anyone, and music is only served through the app's signed-in file route (`/api/music/file/<id>`). After upgrading from a version with a public bucket, run Setup again (Setup tab, "Run setup"); the Storage "Access" row shows Ready once the bucket is private. Old direct Appwrite file links stop working.

If initialisation fails, the error toast and the setup page show Appwrite's message. A `missing scopes` error means the API key needs the scopes listed above.

Alternatively, run the setup scripts manually before deployment:
```bash
npm run setup:appwrite
```

## Local Docker Development

A `docker-compose.override.yml` exists for local Docker overrides. To run locally:

```bash
# Build and run
docker compose up -d --build

# View logs
docker compose logs -f music-manager
```

The application is available at `http://localhost:3333`.

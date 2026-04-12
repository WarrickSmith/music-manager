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
| `APPWRITE_API_KEY` | Yes | Appwrite server API key with full permissions |
| `APPWRITE_DATABASE_ID` | Yes | Appwrite database ID |
| `APPWRITE_COMPETITIONS_COLLECTION_ID` | Yes | Competitions collection ID |
| `APPWRITE_GRADES_COLLECTION_ID` | Yes | Grades collection ID |
| `APPWRITE_MUSIC_FILES_COLLECTION_ID` | Yes | Music files collection ID |
| `APPWRITE_BUCKET_ID` | Yes | Storage bucket ID |

## First Run

On first deployment, the Appwrite database/collections/storage may not exist yet. The application handles this gracefully:

1. The admin dashboard detects missing Appwrite resources via `checkAppwriteInitialization()`
2. An initialisation UI is displayed to the admin user
3. Clicking "Initialize" runs the `setup-appwrite.ts` script within the app runtime
4. This creates the database, collections (with attributes and permissions), storage bucket, and indexes

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

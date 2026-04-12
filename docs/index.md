# Music Manager — Documentation Index

> **Generated:** 2026-04-12 | **Scan Level:** Deep

## Project Overview

- **Type:** Full-stack monolith (Next.js App Router)
- **Primary Language:** TypeScript 6
- **Framework:** Next.js 16.2.3 + React 19.2.5
- **Backend:** Appwrite (server-side Node.js SDK v23)
- **Architecture:** Server Components + Server Actions (no REST API routes)

## Quick Reference

- **Tech Stack:** Next.js 16, React 19, TypeScript 6, Tailwind CSS 4, shadcn/ui, Appwrite, Zod 4
- **Entry Point:** `src/app/layout.tsx`
- **Architecture Pattern:** Server-side monolith with Server Actions data layer
- **Deployment:** Docker → Zot Registry → Portainer

## Generated Documentation

- [Project Overview](./project-overview.md) — Executive summary, tech stack, features, and user roles
- [Architecture](./architecture.md) — System architecture, auth flow, data flow, design decisions
- [Source Tree Analysis](./source-tree-analysis.md) — Annotated directory structure and critical paths
- [Data Models](./data-models.md) — Appwrite database schema, collections, relationships, and storage
- [Server Actions Reference](./api-contracts.md) — All server action modules with parameters and return types
- [Component Inventory](./component-inventory.md) — UI components catalog (shadcn/ui + custom)
- [Development Guide](./development-guide.md) — Setup, environment variables, commands, conventions
- [Deployment Guide](./deployment-guide.md) — Docker, CI/CD, Portainer, environment configuration

## Reference Documentation

- [Appwrite Database API](./AppwriteAPI/appwrite-database-server-api.md) — Server-side database SDK examples
- [Appwrite Storage API](./AppwriteAPI/appwrite-storage-server-api.md) — Server-side storage SDK examples
- [Appwrite Users API](./AppwriteAPI/appwrite-users-server-api.md) — Server-side users SDK examples

## Archived Documentation

Historical planning documents and superseded docs are preserved in `.archive/`:

- `.archive/mm-plan.md` — Original 8-phase development plan (references Next.js 15)
- `.archive/mm-plan-p5.md` — Phase 5 detailed implementation plan
- `.archive/mm-plan-p5-brief.md` — Phase 5 task brief template
- `.archive/appwrite-ss-auth.md` — Appwrite SSR auth tutorial (reference)
- `.archive/music-manager-data-model.md` — Original data model (superseded by data-models.md)

## Getting Started

1. See [Development Guide](./development-guide.md) for local setup
2. See [Deployment Guide](./deployment-guide.md) for production deployment
3. See [Architecture](./architecture.md) to understand the system design
4. See [Server Actions Reference](./api-contracts.md) when working on backend logic

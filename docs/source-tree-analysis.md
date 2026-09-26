# Music Manager — Source Tree Analysis

> **Generated:** 2026-04-12

## Directory Structure

```
music-manager/
├── .github/
│   └── workflows/
│       └── publish-image.yml       # CI/CD: build & push Docker image to Zot registry
├── docs/                            # Project documentation
│   ├── index.md                     # Documentation index (entry point)
│   ├── project-overview.md          # Project overview and tech stack
│   ├── architecture.md              # Architecture and design decisions
│   ├── source-tree-analysis.md      # This file
│   ├── data-models.md               # Appwrite database schema
│   ├── api-contracts.md             # Server Actions reference
│   ├── component-inventory.md       # UI component catalog
│   ├── development-guide.md         # Dev setup and workflows
│   ├── deployment-guide.md          # Docker, CI/CD, Portainer
│   └── AppwriteAPI/                 # Appwrite SDK reference examples
│       ├── appwrite-tablesdb-server-api.md
│       ├── appwrite-storage-server-api.md
│       └── appwrite-users-server-api.md
├── public/                          # Static assets (favicon, images)
├── scripts/
│   └── setup-appwrite.ts            # Appwrite setup script (DB, tables, storage, teams, indexes)
├── src/
│   ├── app/                         # Next.js App Router
│   │   ├── layout.tsx               # ★ Root layout (auth, theme, navbar, toaster)
│   │   ├── page.tsx                 # Landing page
│   │   ├── globals.css              # Tailwind CSS 4 theme definitions
│   │   ├── (auth)/                  # Route group: authentication pages
│   │   │   ├── layout.tsx           # Auth layout wrapper
│   │   │   ├── login/page.tsx       # Login form
│   │   │   └── register/page.tsx    # Registration form
│   │   ├── admin/
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx       # Admin dashboard layout
│   │   │       └── page.tsx         # Admin dashboard (tabbed UI)
│   │   ├── dashboard/
│   │   │   ├── layout.tsx           # Competitor dashboard layout
│   │   │   └── page.tsx             # Competitor dashboard (tabbed UI)
│   │   └── actions/                 # ★ Server Actions (data layer)
│   │       ├── auth-actions.ts      # Login, register, logout
│   │       ├── competition-actions.ts # Competition + grade queries
│   │       ├── grade-actions.ts     # Grade CRUD
│   │       ├── music-file-actions.ts # File upload, delete, URL generation
│   │       └── user-actions.ts      # User management, profiles, passwords
│   ├── components/
│   │   ├── layout/
│   │   │   └── navbar.tsx           # Global navigation bar (theme toggle, auth status)
│   │   ├── dashboard/
│   │   │   ├── admin/               # Admin dashboard components
│   │   │   │   ├── appwrite-initialization-wrapper.tsx
│   │   │   │   ├── appwrite-initialization.tsx
│   │   │   │   ├── competition-card.tsx
│   │   │   │   ├── competition-list.tsx
│   │   │   │   ├── competition-management.tsx
│   │   │   │   ├── create-competition-dialog.tsx
│   │   │   │   ├── grade-form.tsx
│   │   │   │   ├── grade-management.tsx
│   │   │   │   ├── music-file-management.tsx
│   │   │   │   ├── profile-management.tsx
│   │   │   │   └── user-management.tsx
│   │   │   ├── competitor/          # Competitor dashboard components
│   │   │   │   ├── competitor-dashboard.tsx
│   │   │   │   ├── file-card.tsx
│   │   │   │   ├── my-files.tsx
│   │   │   │   ├── profile-management.tsx
│   │   │   │   └── upload-music.tsx
│   │   │   └── competitor-view.tsx  # Competitor view wrapper
│   │   └── ui/                      # ★ shadcn/ui components
│   │       ├── alert-dialog.tsx
│   │       ├── audio-player-button.tsx  # Custom: in-browser audio playback
│   │       ├── badge.tsx
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── dialog.tsx
│   │       ├── form.tsx
│   │       ├── input.tsx
│   │       ├── label.tsx
│   │       ├── loading-overlay.tsx      # Custom: full-screen loading spinner
│   │       ├── local-loading-card.tsx   # Custom: card-level loading indicator
│   │       ├── progress-indicator.tsx   # Custom: upload progress UI
│   │       ├── progress.tsx
│   │       ├── radio-group.tsx
│   │       ├── select.tsx
│   │       ├── switch.tsx
│   │       ├── table.tsx
│   │       ├── tabs.tsx
│   │       └── toast.tsx
│   ├── hooks/
│   │   └── useUploadProgress.ts     # Simulated upload progress tracker
│   ├── lib/
│   │   ├── appwrite/
│   │   │   ├── server.ts            # ★ Appwrite SDK setup (lazy proxy pattern)
│   │   │   ├── initialization-service.ts  # Check/create Appwrite resources at runtime
│   │   │   └── default-grades.ts    # NZ ice skating grade template (80+ grades)
│   │   ├── auth/
│   │   │   └── auth-service.ts      # ★ Session management (create, verify, logout, register)
│   │   ├── theme.ts                 # Theme cookie utilities
│   │   └── utils.ts                 # cn(), toPlainObject(), formatDate/FileSize/Duration
│   └── proxy.ts                     # Middleware: cookie passthrough, image caching
├── components.json                  # shadcn/ui configuration
├── docker-compose.yml               # Portainer stack definition
├── docker-compose.override.yml      # Local Docker overrides
├── Dockerfile                       # Multi-stage build (node:24-alpine)
├── eslint.config.mjs                # ESLint 9 flat config
├── next.config.ts                   # Next.js configuration
├── package.json                     # Dependencies and scripts
├── postcss.config.mjs               # PostCSS (Tailwind CSS 4)
└── tsconfig.json                    # TypeScript configuration
```

## Critical Directories

| Directory | Purpose |
|---|---|
| `src/app/actions/` | All server-side business logic (Server Actions) |
| `src/lib/appwrite/` | Appwrite SDK configuration, initialisation, grade templates |
| `src/lib/auth/` | Authentication and session management |
| `src/components/dashboard/admin/` | Admin dashboard feature components |
| `src/components/dashboard/competitor/` | Competitor dashboard feature components |
| `src/components/ui/` | Reusable UI primitives (shadcn/ui + custom) |
| `scripts/` | Appwrite infrastructure setup scripts |
| `.github/workflows/` | CI/CD pipeline |

## Entry Points

- **Application:** `src/app/layout.tsx` — root layout, auth check, theme resolution
- **Admin Dashboard:** `src/app/admin/dashboard/page.tsx`
- **Competitor Dashboard:** `src/app/dashboard/page.tsx`
- **Auth:** `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`
- **Build:** `Dockerfile` (multi-stage, standalone output)
- **CI/CD:** `.github/workflows/publish-image.yml`

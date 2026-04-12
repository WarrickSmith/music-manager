# Music Manager — Component Inventory

> **Generated:** 2026-04-12

## Component Library

The project uses **shadcn/ui** (new-york style) with Radix UI primitives, extended with custom application-specific components. All components use TypeScript and Tailwind CSS 4.

## Layout Components (`src/components/layout/`)

| Component | File | Description |
|---|---|---|
| Navbar | `navbar.tsx` | Global navigation bar with logo, theme toggle (dark/light), and auth status indicator (colour-coded by role: purple=admin, green=competitor, blue=logged out) |

## Admin Dashboard Components (`src/components/dashboard/admin/`)

| Component | File | Description |
|---|---|---|
| AppwriteInitialization | `appwrite-initialization.tsx` | UI for bootstrapping Appwrite resources on first run |
| AppwriteInitializationWrapper | `appwrite-initialization-wrapper.tsx` | Wrapper that conditionally shows init UI or dashboard |
| CompetitionCard | `competition-card.tsx` | Card displaying a single competition with status toggle and actions |
| CompetitionList | `competition-list.tsx` | List view of competitions (active/inactive sections) |
| CompetitionManagement | `competition-management.tsx` | Full competition management tab with create/delete/toggle |
| CreateCompetitionDialog | `create-competition-dialog.tsx` | Modal dialog for creating competitions (default grades or clone) |
| GradeForm | `grade-form.tsx` | Inline grade editing form (edit/cancel pattern) |
| GradeManagement | `grade-management.tsx` | Grade CRUD within a selected competition |
| MusicFileManagement | `music-file-management.tsx` | Admin view of all submitted music files |
| ProfileManagement | `profile-management.tsx` | Admin profile editing (name, phone, password) |
| UserManagement | `user-management.tsx` | User listing with role toggle, status toggle, delete |

## Competitor Dashboard Components (`src/components/dashboard/competitor/`)

| Component | File | Description |
|---|---|---|
| CompetitorDashboard | `competitor-dashboard.tsx` | Main competitor dashboard with tabbed navigation |
| CompetitorView | `../competitor-view.tsx` | Wrapper component for competitor view |
| FileCard | `file-card.tsx` | Card displaying a music file with play, download, delete actions |
| MyFiles | `my-files.tsx` | List of competitor's uploaded files |
| ProfileManagement | `profile-management.tsx` | Competitor profile editing |
| UploadMusic | `upload-music.tsx` | Multi-step upload form (competition → category → segment → file) |

## UI Primitives (`src/components/ui/`)

### shadcn/ui Components (Radix UI based)

| Component | File | Radix Primitive |
|---|---|---|
| AlertDialog | `alert-dialog.tsx` | `@radix-ui/react-alert-dialog` |
| Button | `button.tsx` | `@radix-ui/react-slot` |
| Card | `card.tsx` | — (div-based) |
| Dialog | `dialog.tsx` | `@radix-ui/react-dialog` |
| Form | `form.tsx` | react-hook-form + Zod integration |
| Input | `input.tsx` | — (native input) |
| Label | `label.tsx` | `@radix-ui/react-label` |
| Progress | `progress.tsx` | `@radix-ui/react-progress` |
| RadioGroup | `radio-group.tsx` | `@radix-ui/react-radio-group` |
| Select | `select.tsx` | `@radix-ui/react-select` |
| Switch | `switch.tsx` | `@radix-ui/react-switch` |
| Table | `table.tsx` | — (native table) |
| Tabs | `tabs.tsx` | `@radix-ui/react-tabs` |

### Custom UI Components

| Component | File | Description |
|---|---|---|
| AudioPlayerButton | `audio-player-button.tsx` | In-browser audio playback button (streams from Appwrite) |
| Badge | `badge.tsx` | Status/category badge with variants |
| LoadingOverlay | `loading-overlay.tsx` | Full-screen blurred loading spinner with status text |
| LocalLoadingCard | `local-loading-card.tsx` | Card-level loading indicator |
| ProgressIndicator | `progress-indicator.tsx` | Upload progress bar with phase-aware animation |
| Toast | `toast.tsx` | Sonner toast wrapper/customisation |

## Custom Hooks (`src/hooks/`)

| Hook | File | Description |
|---|---|---|
| `useUploadProgress` | `useUploadProgress.ts` | Simulated upload progress with 4 phases (fast→medium→slow→cap at 95%) since server actions don't support streaming progress |

## Design System

- **Style:** shadcn/ui "new-york" variant
- **Colours:** oklch colour space via CSS custom properties
- **Theming:** Light/dark mode with cookie persistence
- **Typography:** Geist Sans + Geist Mono (Google Fonts)
- **Icons:** Lucide React
- **Backgrounds:** Custom gradient backgrounds per theme (radial + linear gradients)
- **Panels:** `.app-panel` utility class (rounded, bordered, blurred backdrop)
- **Banners:** `.app-shell-banner` utility class (gradient background)

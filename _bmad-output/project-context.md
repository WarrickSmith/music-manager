---
project_name: 'music-manager'
user_name: 'Warrick'
date: '2026-04-12'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 90
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Technology Stack & Versions

**Framework & Runtime**
- Next.js `15.2.8` — App Router, Server Actions, Turbopack dev (`next dev --turbopack`)
- React `19.0.3` + `react-dom 19.0.3` (pinned exactly)
- TypeScript `^5` — strict mode, `target: ES2017`, `moduleResolution: bundler`
- Node.js via `tsx ^4.19` for Appwrite setup scripts

**Backend / BaaS**
- Appwrite server `1.9.0` (latest) — self-hosted standalone deployment
- `node-appwrite ^15.0.0` — server SDK ONLY (no client/browser SDK in this project); must remain compatible with Appwrite server `1.9.x`
- Appwrite resources: Databases, Storage (single bucket), Users, Teams, Account

**UI**
- Tailwind CSS `^4` via `@tailwindcss/postcss ^4` (v4, NOT v3 — no `tailwind.config.js`)
- shadcn/ui components in `src/components/ui/` built on Radix primitives
  (`@radix-ui/react-{alert-dialog,dialog,dropdown-menu,label,progress,radio-group,select,slot,switch,tabs}`)
- `tailwind-merge ^3`, `tailwindcss-animate ^1`, `class-variance-authority ^0.7`, `clsx ^2`
- Icons: `lucide-react ^0.477` (primary) and `react-icons ^5.5`
- Toasts: `sonner ^2.0` (NOT a custom toaster)

**Forms & Validation**
- `react-hook-form ^7.54` + `@hookform/resolvers ^4.1` + `zod ^3.24`

**Domain**
- `music-metadata ^11` — audio duration extraction (buffer-based parsing)
- `dotenv ^16.4` — Appwrite setup scripts

**Tooling**
- ESLint `^9` flat config extending `next/core-web-vitals` + `next/typescript`
- No test framework configured (Jest/Vitest/Playwright absent)
- Path alias: `@/*` → `./src/*`

**Version constraints**
- `@types/react 19.0.12` / `@types/react-dom 19.0.4` pinned via `overrides` — do NOT bump without coordination
- React 19 + Next 15 + Tailwind v4 are a tightly coupled triple; upgrading one usually requires upgrading the others

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

**Strict mode is on — respect it**
- `strict: true` in [tsconfig.json](tsconfig.json). No implicit `any`, no `any` escape hatches in new code
- Use `unknown` + narrowing for caught errors: `error instanceof Error ? error.message : 'Unknown error'` (pattern already in use across server actions)
- `isolatedModules: true` — every file must be independently transpilable; no re-exported ambient types without `export type`

**Imports**
- ALWAYS use the `@/*` path alias for `src/*` — never relative `../../`
- Prefer named imports from `node-appwrite` via the project wrapper [src/lib/appwrite/server.ts](src/lib/appwrite/server.ts), not directly, so the shared client/services are reused
- Re-export `ID` and `Query` from `@/lib/appwrite/server` — do not import them from `node-appwrite` in feature code

**Async conventions**
- Use `async/await` everywhere; no raw `.then()` chains
- `cookies()` from `next/headers` is async in Next 15 — `const cookieStore = await cookies()` (already the pattern in [auth-service.ts](src/lib/auth/auth-service.ts))

**Env var access**
- Environment variables are read via `process.env.APPWRITE_*` with non-null assertions (`!`) only AFTER a guarded fallback or a top-level validation. Prefer guarding at function entry: `if (!dbId) throw new Error('Missing ...')`
- Never hardcode Appwrite IDs — always source from env

**Error handling**
- Server Actions and server-side helpers follow a consistent shape: `try { ... } catch (error) { console.error('<context>:', error); throw new Error('<user-facing>') }`
- Server Actions returning to forms use a result object `{ success, error?, redirectTo?, message? }` rather than throwing (see [auth-actions.ts](src/app/actions/auth-actions.ts))

**Type boundaries**
- Domain types live in [src/types/index.ts](src/types/index.ts). Extend this file rather than redefining shapes locally
- When working with Appwrite `listDocuments` results, type via `Models.Document` from `node-appwrite` (pattern used in [music-file-actions.ts](src/app/actions/music-file-actions.ts))

### Framework-Specific Rules (Next.js 15 + React 19)

**App Router conventions**
- Routes live in [src/app/](src/app/). Route groups in use: `(auth)` for login/register, `admin/`, `dashboard/`
- Every dashboard route opts into dynamic rendering: `export const dynamic = 'force-dynamic'` (in [src/app/layout.tsx](src/app/layout.tsx), [page.config.ts](src/app/page.config.ts)). Any new route that reads `cookies()` must do the same — static rendering + Appwrite session cookies will break the build
- `suppressHydrationWarning` is set on `<body>` for font-variable reasons — don't remove it

**Server Actions are the write path**
- All mutations flow through files under [src/app/actions/](src/app/actions/), each starting with `'use server'`
- Client components call these actions directly — no API routes (`src/app/api/` is intentionally absent)
- After mutation, call `revalidatePath('/dashboard')` or the relevant route (pattern in [music-file-actions.ts](src/app/actions/music-file-actions.ts))
- Form actions accept `FormData` and return a plain result object, not a redirect — the client handles the redirect from `result.redirectTo`

**Auth & routing**
- Session cookie is named `mm-session`; HTTP-only, 7-day expiry, set via `cookies().set()` inside a Server Action ONLY (cannot be set from middleware or RSC)
- [src/middleware.ts](src/middleware.ts) only forwards the cookie + sets cache headers — it does NOT gate routes. Route protection happens in layout `page.tsx`/`layout.tsx` via `getCurrentUser()` + `redirect()` (see [src/app/dashboard/layout.tsx](src/app/dashboard/layout.tsx))
- Role is derived from Appwrite user `labels` (`'admin'` vs `'competitor'`) — NOT from a database field. Use `getUserRole()` or inspect `user.labels.includes('admin')` directly

**Appwrite client discipline**
- ONE global admin client is exported from [src/lib/appwrite/server.ts](src/lib/appwrite/server.ts) using `APPWRITE_API_KEY` — for admin-scoped operations (Databases, Storage, Users)
- For session-scoped calls (`account.get()`, `account.deleteSession()`), construct a FRESH `Client().setSession(...)` — never mutate the shared client. The API-key client and session client cannot coexist on the same instance
- Feature code imports `databases`, `storage`, `users`, `ID`, `Query` from `@/lib/appwrite/server`, not from `node-appwrite`
- Guard every entry point with `checkAppwriteInitialization()` for read operations that can be called before setup completes (see [music-file-actions.ts:19](src/app/actions/music-file-actions.ts#L19))

**Pagination**
- Appwrite `listDocuments` caps at 100 per call. Use the loop pattern in [music-file-actions.ts:47-74](src/app/actions/music-file-actions.ts#L47-L74) for full-collection fetches — do NOT call `listDocuments` unpaginated and assume completeness

**React 19 notes**
- Server Components are the default in `src/app/**` — add `'use client'` only when you need hooks, event handlers, or browser APIs
- Use React 19 `use()` for awaited promises in client components where helpful; keep data fetching in Server Components where possible
- `RootLayout` is `async` and calls `getCurrentUser()` — follow the same pattern for layouts that need user context

**UI component rules**
- Never create a new `src/components/ui/` primitive by hand — add via the shadcn/ui CLI (`components.json` is present)
- Compose shadcn primitives in feature components under `src/components/dashboard/` rather than modifying the primitives
- Tailwind v4: styles come from `globals.css` with `@import "tailwindcss";` — no `tailwind.config.js`. Theme tokens live in CSS, not JS
- Use `cn()` from [src/lib/utils.ts](src/lib/utils.ts) for conditional class merging (wraps `clsx` + `tailwind-merge`)
- Toasts: `import { toast } from 'sonner'` — there is ONE `<Toaster>` in the root layout; do not mount another

### Testing Rules

**No test framework is currently configured**
- `package.json` has no `test` script and no Jest/Vitest/Playwright dependencies
- Do NOT add test files or test infrastructure unless the user explicitly requests it — introducing one now is a scope decision, not a chore
- Do NOT "fix" missing tests by scaffolding them; mention the absence in the PR description instead

**When asked to add tests**
- Confirm the framework choice with the user before installing. Reasonable defaults given the stack: Vitest + React Testing Library for unit/component, Playwright for E2E
- Place unit/component tests alongside source: `foo.tsx` + `foo.test.tsx`
- Place E2E tests under a top-level `e2e/` directory
- Server Actions must be tested against a real (dev) Appwrite instance or a thin fake — do NOT mock `node-appwrite` deeply; the session-vs-admin client split is the thing most likely to break and is invisible to shallow mocks

**Manual verification expectations**
- For UI or data-flow changes, run `npm run dev` and exercise the flow in a browser before reporting done
- For Appwrite schema or setup script changes, run the relevant `npm run setup:appwrite:*` script against a dev project and confirm idempotency
- Type-check via `npm run build` (no standalone `tsc` script) when verifying non-runtime correctness

### Code Quality & Style Rules

**Linting / formatting**
- ESLint flat config at [eslint.config.mjs](eslint.config.mjs) extends `next/core-web-vitals` + `next/typescript` — run `npm run lint` before declaring work done
- There is NO Prettier config; match the existing file's style (2-space indent, single quotes). Mirror the file you're editing
- Don't add a Prettier config unilaterally — that's a project-wide decision

**File & folder naming**
- React components and pages: **kebab-case** filenames (`competitor-view.tsx`, `audio-player-button.tsx`), default export a **PascalCase** component
- Server action files: **kebab-case** with `-actions.ts` suffix (`music-file-actions.ts`)
- Service/helper files: **kebab-case** (`auth-service.ts`, `initialization-service.ts`)
- shadcn primitives keep their CLI-generated lowercase names (`button.tsx`, `dialog.tsx`)
- Folders: **kebab-case** or lowercase; route groups use parentheses (`(auth)`)

**Code organization**
- Feature components under `src/components/dashboard/<role>/`; shared primitives under `src/components/ui/`; layout chrome under `src/components/layout/`
- Business logic in Server Actions ([src/app/actions/](src/app/actions/)); Appwrite access wrapped in [src/lib/appwrite/](src/lib/appwrite/); auth helpers in [src/lib/auth/](src/lib/auth/)
- Domain types centralized in [src/types/index.ts](src/types/index.ts)
- Custom hooks in [src/hooks/](src/hooks/), named `use-*.ts`

**Naming in code**
- Server Action functions end in `Action` when they're the direct form target (`loginAction`, `registerAction`); data helpers like `getUserMusicFiles` omit the suffix
- Boolean variables: `is*` / `has*` (`isFirstUser`, `hasMoreDocuments`)
- Appwrite env vars: `APPWRITE_*_COLLECTION_ID` / `APPWRITE_BUCKET_ID` — match existing names exactly in [scripts/setup-appwrite.ts](scripts/setup-appwrite.ts)

**Documentation**
- JSDoc `/** */` blocks on exported server helpers describing purpose (pattern in [server.ts](src/lib/appwrite/server.ts), [music-file-actions.ts](src/app/actions/music-file-actions.ts)) — keep them short, one sentence
- No inline commentary on obvious code; retain existing comments when they explain WHY (e.g. the session-client-vs-admin-client note in [auth-service.ts:56-60](src/lib/auth/auth-service.ts#L56-L60))
- Do NOT add "what changed" or "fix for issue X" comments — that's PR-description territory

### Development Workflow Rules

**Branching**
- `main` is production; all work lands via PR. Direct commits to `main` are off-limits
- Branch prefixes observed in git history: `feat/*`, `fix/*`, `chore/*`, `refactor/*` — match the type of change
- Current active branch may be a long-lived effort (e.g. `feat/project-refresh`); check `git status` before creating a new one

**Commits**
- Conventional-commit style is in use (`chore:`, `fix:`, `refactor:`, `feat:`, `style:`) — lowercase type, short imperative subject
- Create NEW commits rather than amending; let pre-commit hooks (if any) run naturally
- Never commit `.env`, `.env.local`, or anything under `node_modules/`

**PRs**
- Every merge to `main` in history goes through a PR — follow the same path. PR titles mirror the branch type (`fix: …`, `chore: …`)
- Summarize *why* in the PR description; reference the motivating issue or Appwrite/Next.js advisory when the change is dependency-driven

**Environment & secrets**
- Local dev reads from `.env` via [docker-compose.override.yml](docker-compose.override.yml); Portainer deployments rely on build args + runtime env injection (see [docker-compose.yml](docker-compose.yml)). Any new env var must be added to BOTH `build.args` AND `environment` blocks, and documented in [README.md](README.md)
- Appwrite vars are NOT prefixed with `NEXT_PUBLIC_*` — they are server-only. Do not leak them into client components
- Never log env values; the existing `console.error('Missing required Appwrite environment variables')` pattern is the right level of detail

**Appwrite bootstrap**
- Schema changes go through [scripts/setup-appwrite.ts](scripts/setup-appwrite.ts). Use the matching npm target: `setup:appwrite:db|collections|storage|grades|indexes|teams`
- Scripts must be idempotent — running them twice should not duplicate collections, indexes, or teams
- Test setup scripts against a fresh dev Appwrite project AND an existing one before merging

**Docker / deployment**
- App serves on container port `3000`, exposed as host `3333` (see [docker-compose.yml:20-21](docker-compose.yml#L20-L21))
- Portainer uses the base compose file only (no override); local dev auto-applies [docker-compose.override.yml](docker-compose.override.yml). Keep this split — do not merge them
- `NEXT_PUBLIC_*` vars must be present at BUILD time (Docker `args`), not just runtime — Next.js inlines them into the client bundle during `next build`

**Running locally**
- `npm run dev` uses Turbopack — faster but occasionally diverges from `next build` in output. Always run `npm run build` before declaring a refactor done
- `npm run lint` is the only quality gate currently wired; no `typecheck` script, so `build` is your typecheck

### Critical Don't-Miss Rules

**Appwrite client split — the #1 footgun**
- The exported `client` / `databases` / `storage` / `users` from [src/lib/appwrite/server.ts](src/lib/appwrite/server.ts) use the admin API key. DO NOT call `client.setSession(...)` on it — that mutates the shared singleton and poisons every other request
- For user-scoped Account operations, always `new Client().setEndpoint(...).setProject(...).setSession(value)` then `new Account(sessionClient)` (see [auth-service.ts:56-60](src/lib/auth/auth-service.ts#L56-L60))
- New users are created via `new Account(client).create(...)` — NOT `users.create()` — because the `Users` service doesn't accept plain passwords the same way (see [auth-service.ts:111-118](src/lib/auth/auth-service.ts#L111-L118))

**First-user = admin logic**
- The very first registered user gets the `admin` label; everyone else gets `competitor`. This check runs BEFORE user creation to avoid races ([auth-service.ts:99-109](src/lib/auth/auth-service.ts#L99-L109)). Do not reorder
- Role is read from `user.labels`, not from user preferences, a collection, or a team. Changing this model breaks middleware, layouts, and server actions simultaneously

**Session cookie rules**
- Cookie name is `mm-session` (literal; matched in [middleware.ts:16](src/middleware.ts#L16) and auth service). Renaming requires updating BOTH
- `cookies().set()` works ONLY inside Server Actions or Route Handlers. In RSC / layouts, you can READ cookies but not WRITE them — respect this or Next 15 will throw at runtime
- `getCurrentUser()` must NOT delete invalid cookies — only a Server Action can. It returns `null` and lets the caller decide

**Dynamic rendering is required**
- Every route that touches cookies must set `export const dynamic = 'force-dynamic'`. The root layout already does this globally ([src/app/layout.tsx:9](src/app/layout.tsx#L9)), but do not remove it
- A stray static route reading cookies will crash the build with a "Dynamic server usage" error

**File upload pipeline**
- Allowed MIME types are hardcoded in both [server.ts:173-185](src/lib/appwrite/server.ts#L173-L185) AND [music-file-actions.ts:104-113](src/app/actions/music-file-actions.ts#L104-L113). Update BOTH when adding a format
- Duration is extracted client-side when possible (passed via FormData) and falls back to server-side `music-metadata.parseBuffer`. Do not remove the fallback
- File name format: `[year]-[competition]-[category]-[segment]-[firstname]-[lastinitial].[ext]`, lowercased, non-alphanumerics → `-`. The formatter in [music-file-actions.ts:194-212](src/app/actions/music-file-actions.ts#L194-L212) is the source of truth
- Do NOT persist `downloadURL` in the database — URLs can expire. Generate them on demand via `getMusicFileDownloadUrl` / `getMusicFileViewUrl`

**Appwrite storage URL quirks**
- The endpoint env var may or may not include `/v1`; the code probes with `baseUrl.endsWith('/v1') ? '' : '/v1'` ([music-file-actions.ts:324](src/app/actions/music-file-actions.ts#L324)). Preserve this — don't assume either form
- Download URLs use `&mode=admin` (requires API key path); view/streaming URLs do NOT, because the bucket allows public read. If you tighten bucket permissions, both URL builders must change
- Streaming URLs append a cache-buster timestamp to dodge browser audio caching bugs — keep it

**Pagination**
- `listDocuments` silently caps at 100. If you call it without a paging loop, you will lose data once the collection grows. Use the loop in [music-file-actions.ts:47-74](src/app/actions/music-file-actions.ts#L47-L74)

**Initialization guard**
- Read paths that can run pre-setup call `checkAppwriteInitialization()` from [src/lib/appwrite/initialization-service.ts](src/lib/appwrite/initialization-service.ts) and return an empty array when not initialized. Don't remove this — the app is expected to render gracefully on a fresh Appwrite instance

**Security**
- `APPWRITE_API_KEY` is admin-scoped; never import it into a client component, never include it in a public env var, never log it
- User-supplied strings that become file names are sanitized via `.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase()` — always sanitize before touching storage
- `formatFileName` in [server.ts:100-151](src/lib/appwrite/server.ts#L100-L151) and the inline formatter in `uploadMusicFile` are DUPLICATES with subtly different output (`+` vs `-` separator, case handling). The upload path uses the inline version. If you unify them, check every call site

**Anti-patterns to avoid**
- Adding `src/app/api/*` route handlers for things Server Actions already do
- Importing `node-appwrite` directly in feature code instead of going through `@/lib/appwrite/server`
- Mocking `node-appwrite` in tests (see Testing Rules)
- Redefining `User`, `Competition`, `Grade`, or `MusicFile` types locally — extend [src/types/index.ts](src/types/index.ts)
- Using `redirect()` from inside a Server Action return path when the form client is expecting a `{ redirectTo }` result object

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code in this project
- Follow ALL rules exactly as documented; when in doubt, prefer the more restrictive option
- Treat the rules in "Critical Don't-Miss" as hard constraints — violating them breaks auth, uploads, or deployment
- Propose updates to this file when new patterns emerge, but do not rewrite it unsolicited

**For Humans:**
- Keep this file lean and focused on agent needs — prune obvious rules as the codebase matures
- Update when the technology stack changes (Next.js / React / Appwrite server / node-appwrite major bumps)
- Review periodically for stale line numbers and removed files
- The Appwrite server version (`1.9.0` standalone) and the `node-appwrite` SDK pin are the two values most likely to drift — verify on each upgrade

Last Updated: 2026-04-12

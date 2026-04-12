---
title: 'Repo cleanup: dead code, redundant files, and consolidation'
type: 'chore'
created: '2026-04-12'
status: 'done'
baseline_commit: '17f12582a7d3b208af99f02027b679da4212551c'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repo has accumulated dead code, duplicated logic, orphan files, and an inconsistent docs folder structure. Several files are referenced nowhere, an entire `helpers.ts` module is fully duplicated by `server.ts` + action files, and root-level planning artifacts are scattered.

**Approach:** Delete files and exports verified to be dead, consolidate `Docs/` (mixed-case) plus root-level historical artifacts into the canonical lowercase `docs/` folder used by BMad's `project_knowledge` config, and uninstall npm dependencies that fall out of scope after deletions. Verify by running `next build`, `next lint`, and `next dev` smoke-test.

## Boundaries & Constraints

**Always:**
- Use `git mv` for file moves so history is preserved.
- Verify each candidate is dead with grep before deleting (no assumed deletions).
- After every batch, run `npm run lint` + `npm run build` to catch breakage.
- Stay out of `_bmad/`, `_bmad-output/`, `.claude/`, `.agents/`, `.next/`, `node_modules/`, `.git/`.

**Ask First:**
- Any file whose dead-ness is ambiguous (e.g., referenced only by another dead file).
- Any deletion that requires touching `package.json` scripts.
- If `npm run build` or `next dev` fails after a change, HALT and report instead of patching blind.

**Never:**
- Delete tracked files outside the verified dead list.
- Change runtime behavior of live code paths.
- Refactor live functions for "simplification" — out of scope.
- Touch the `force-dynamic` export in `src/app/layout.tsx` (it's the live one covering all routes).
- Delete `next-env.d.ts`, `Dockerfile`, `docker-compose*.yml`, `.env*`, anything in `public/mm-logo.png`.

</frozen-after-approval>

## Code Map

- `src/types/index.ts` -- DEAD: zero imports of `@/types`; types defined inline by consumers
- `src/hooks/use-audio-player.ts` -- DEAD: superseded by `src/components/ui/audio-player-button.tsx`; no callers
- `src/lib/appwrite/helpers.ts` -- DEAD: every export duplicated in `server.ts` or `app/actions/*`; no importers
- `src/lib/appwrite/server.ts` -- LIVE but contains dead exports: `getCompetitions`, `getGradesForCompetition`, `getMusicFilesForUser`, `formatFileName`, `getFileDownloadUrl`, `isValidMusicFileType`, `isUserAdmin`, `verifyAdminAccess` (consumers use action versions)
- `src/components/ui/dropdown-menu.tsx` -- DEAD: only self-references
- `src/app/page.config.ts` + `src/app/dashboard/page.config.ts` + `src/app/admin/dashboard/page.config.ts` + `src/app/(auth)/login/page.config.ts` + `src/app/(auth)/register/page.config.ts` -- DEAD: not a Next.js convention, never imported, and `src/app/layout.tsx` already exports `dynamic = 'force-dynamic'` for all routes
- `public/file.svg`, `public/globe.svg`, `public/next.svg`, `public/vercel.svg`, `public/window.svg` -- DEAD: Next.js default scaffolding, unreferenced
- `Docs/setup-appwrite.ts` -- DEAD: superseded by `scripts/setup-appwrite.ts`
- `Docs/default-grades.ts` -- DEAD: data now inlined in `src/lib/appwrite/initialization-service.ts`
- `Docs/*.md`, `Docs/AppwriteAPI/*.md` -- LIVE docs, wrong-cased folder; move to `docs/`
- `mm-plan-p5.md`, `mm-plan-p5-brief.md`, `portainer error.jpg` -- root-level historical artifacts; move to `docs/`
- `package.json` deps `@radix-ui/react-dropdown-menu`, `react-icons` -- become unused after the above deletions and icon swap
- `src/app/page.tsx`, `src/components/layout/navbar.tsx` -- only `react-icons` consumers (5 icons total: `FaMusic`, `FaUpload`, `FaHeadphones`, `FaUser`, `FaSignOutAlt`); swap to lucide equivalents (`Music`, `Upload`, `Headphones`, `User`, `LogOut`)

## Tasks & Acceptance

**Execution:**

*Phase 1 — delete dead files (no live code touched)*
- [x] `src/types/index.ts` -- delete -- zero importers
- [x] `src/hooks/use-audio-player.ts` -- delete -- zero importers (and remove now-empty `src/hooks/` if `useUploadProgress.ts` is the only sibling — keep folder, that one is live)
- [x] `src/lib/appwrite/helpers.ts` -- delete -- zero importers, fully duplicated elsewhere
- [x] `src/components/ui/dropdown-menu.tsx` -- delete -- zero importers
- [x] `src/app/page.config.ts` -- delete -- orphan, not a Next.js file convention
- [x] `src/app/dashboard/page.config.ts` -- delete -- same
- [x] `src/app/admin/dashboard/page.config.ts` -- delete -- same
- [x] `src/app/(auth)/login/page.config.ts` -- delete -- same
- [x] `src/app/(auth)/register/page.config.ts` -- delete -- same
- [x] `public/file.svg` -- delete -- unreferenced Next.js default
- [x] `public/globe.svg` -- delete -- unreferenced
- [x] `public/next.svg` -- delete -- unreferenced
- [x] `public/vercel.svg` -- delete -- unreferenced
- [x] `public/window.svg` -- delete -- unreferenced
- [x] `Docs/setup-appwrite.ts` -- delete -- superseded by `scripts/setup-appwrite.ts`
- [x] `Docs/default-grades.ts` -- delete -- ⚠ NOT actually dead; restored to `src/lib/appwrite/default-grades.ts` and import in `src/app/actions/competition-actions.ts:6` updated. Stale references in `docs/README.md` and `docs/mm-plan.md` corrected.

*Phase 2 — prune dead exports inside live files*
- [x] `src/lib/appwrite/server.ts` -- remove `getCompetitions`, `getGradesForCompetition`, `getMusicFilesForUser`, `formatFileName`, `getFileDownloadUrl`, `isValidMusicFileType`, `isUserAdmin`, `verifyAdminAccess` and any imports they alone require -- all duplicated in actions or otherwise unused

*Phase 3 — replace react-icons with lucide-react*
- [x] `src/app/page.tsx` -- replace `FaMusic`/`FaUpload`/`FaHeadphones` from `react-icons/fa` with `Music`/`Upload`/`Headphones` from `lucide-react` -- consolidate on the project's chosen icon library (`components.json` -> `iconLibrary: lucide`)
- [x] `src/components/layout/navbar.tsx` -- replace `FaUser`/`FaSignOutAlt`/`FaMusic` with `User`/`LogOut`/`Music` from `lucide-react` -- same rationale

*Phase 4 — uninstall now-unused dependencies*
- [x] `package.json` -- `npm uninstall @radix-ui/react-dropdown-menu react-icons` -- both have zero remaining importers after Phases 1 & 3

*Phase 5 — consolidate docs into `docs/` (lowercase, BMad canonical)*
- [x] `Docs/README.md` -- `git mv` -> `docs/README.md`
- [x] `Docs/appwrite-ss-auth.md` -- `git mv` -> `docs/appwrite-ss-auth.md`
- [x] `Docs/mm-plan.md` -- `git mv` -> `docs/mm-plan.md`
- [x] `Docs/music-manager-data-model.md` -- `git mv` -> `docs/music-manager-data-model.md`
- [x] `Docs/AppwriteAPI/appwrite-database-server-api.md` -- `git mv` -> `docs/AppwriteAPI/appwrite-database-server-api.md`
- [x] `Docs/AppwriteAPI/appwrite-storage-server-api.md` -- `git mv` -> `docs/AppwriteAPI/appwrite-storage-server-api.md`
- [x] `Docs/AppwriteAPI/appwrite-users-server-api.md` -- `git mv` -> `docs/AppwriteAPI/appwrite-users-server-api.md`
- [x] `Docs/` -- `rmdir` once empty
- [x] `mm-plan-p5.md` -- `git mv` -> `docs/mm-plan-p5.md`
- [x] `mm-plan-p5-brief.md` -- `git mv` -> `docs/mm-plan-p5-brief.md`
- [x] `portainer error.jpg` -- `git mv` -> `docs/portainer-error.jpg` (rename: drop space)

*Phase 6 — verify*
- [x] Run `npm run lint` -- expected: clean
- [x] Run `npm run build` -- expected: succeeds
- [x] Run `npm run dev` and load `/`, `/login`, `/register` in headless check or curl -- expected: no compile errors, no console errors in server output

**Acceptance Criteria:**
- Given the cleanup is complete, when running `npm run build`, then it succeeds with no new warnings vs. baseline.
- Given the cleanup is complete, when running `npm run lint`, then it succeeds with no new errors vs. baseline.
- Given the dev server is started, when navigating to `/`, then the page renders, the logo displays, and the lucide icons render in place of the prior react-icons icons (no missing-icon boxes).
- Given `Docs/` previously existed, when checking after cleanup, then `Docs/` no longer exists and all its prior contents are reachable under `docs/`.
- Given `package.json`, when inspected after cleanup, then `react-icons` and `@radix-ui/react-dropdown-menu` are absent.
- Given a grep for any deleted symbol (`useAudioPlayer`, `verifyAdminAccess`, etc.), when run against `src/`, then it returns zero matches.

## Design Notes

**Why `page.config.ts` files are dead, not relocatable:** Next.js App Router only honors route-segment exports (`dynamic`, `revalidate`, etc.) when they appear in `page.tsx`, `layout.tsx`, or `route.ts`. A sibling file named `page.config.ts` is invisible to the Next.js compiler. The intent (force dynamic rendering) is *already satisfied* by `src/app/layout.tsx:9`, which exports `dynamic = 'force-dynamic'` at the root layout — that cascades to every route. Re-adding the export to each `page.tsx` would be redundant.

**Why `helpers.ts` is dead:** Every exported function exists in either `src/lib/appwrite/server.ts` (e.g. `formatFileName`) or `src/app/actions/*` (e.g. `uploadMusicFile`, `createCompetition`, `updateUserRole`). All consumers import from the action files. A grep for `from.*helpers` returns zero matches across `src/`.

**Icon swap mapping:**
```
FaMusic       -> Music
FaUpload      -> Upload
FaHeadphones  -> Headphones
FaUser        -> User
FaSignOutAlt  -> LogOut
```
Visual equivalence is close but not identical (lucide icons are line-based, react-icons FA are filled). This is the only intentional UI change in this PR.

## Verification

**Commands:**
- `npm run lint` -- expected: exit 0, no errors
- `npm run build` -- expected: exit 0, build artifacts produced under `.next/`
- `npm run dev` (background) + `curl -sf http://localhost:3000/` -- expected: 200 OK, no compile errors in server log
- `git grep -E "useAudioPlayer|verifyAdminAccess|isUserAdmin|getFileDownloadUrl|isValidMusicFileType|getMusicFilesForUser|from ['\"]@/types|from ['\"].*helpers|page\.config|react-icons|@radix-ui/react-dropdown-menu" -- src/ package.json` -- expected: zero matches

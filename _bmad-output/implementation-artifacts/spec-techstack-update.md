---
title: 'Update entire tech stack to latest stable versions'
type: 'chore'
created: '2026-04-12'
status: 'done'
baseline_commit: 'bfab512'
context:
  - '_bmad-output/project-context.md'
---

<frozen-after-approval>

## Intent

**Problem:** The project's dependencies are significantly behind current stable releases. Most critically, `node-appwrite` v15 is outdated for Appwrite server 1.9.0 (latest compatible SDK is v23.x), Node.js base image is v22 (target is v24.12+), and Next.js 15 is one major behind. Staying on old versions increases security risk and blocks access to performance/stability improvements.

**Approach:** Upgrade all dependencies to their latest stable versions in a coordinated order — infrastructure first (Node, Docker), then framework tier (Next.js, React, TypeScript), then libraries — resolving breaking changes at each layer before proceeding to the next.

## Boundaries & Constraints

**Always:**
- Keep Appwrite server 1.9.0 compatibility — verify `node-appwrite` version explicitly states 1.9.x support
- Upgrade `zod` and `@hookform/resolvers` together (Zod 4 requires resolvers v5)
- Upgrade `next` and `eslint-config-next` in lockstep
- Update `@types/react` and `@types/react-dom` overrides to match the new React version
- Run `npm run build` and `npm run lint` after all changes to verify no regressions
- Update `_bmad-output/project-context.md` version numbers to reflect the new stack

**Ask First:**
- If `node-appwrite` v23.x has renamed services, methods, or changed response shapes that require code refactoring beyond import adjustments
- If TypeScript 6 introduces new strict errors that require non-trivial code changes
- If Next.js 16 deprecates or changes config options used in `next.config.ts`

**Never:**
- Downgrade any package from its current version
- Change application logic, features, or behavior — this is a dependency-only upgrade
- Add new dependencies not already in the project
- Modify `.env` files or Appwrite schema/setup scripts (unless SDK API changes force it)

</frozen-after-approval>

## Code Map

- `package.json` -- All dependency versions and overrides
- `Dockerfile` -- Node.js base image version (`node:22-alpine` -> `node:24-alpine`)
- `tsconfig.json` -- May need compiler option adjustments for TS 6
- `next.config.ts` -- May need config adjustments for Next.js 16
- `eslint.config.mjs` -- May need adjustments for ESLint 10
- `src/lib/appwrite/server.ts` -- Primary Appwrite SDK imports and client setup
- `src/lib/auth/auth-service.ts` -- Appwrite Account/Client imports
- `src/app/actions/*.ts` -- Server actions using Appwrite Models
- `src/components/dashboard/competitor/upload-music.tsx` -- Zod schema + Appwrite Models
- `scripts/setup-appwrite.ts` -- Appwrite SDK imports for setup
- `scripts/setup-appwrite-simple.ts` -- Appwrite SDK imports for simple setup
- `_bmad-output/project-context.md` -- Version documentation

## Tasks & Acceptance

**Execution:**
- [x] `Dockerfile` -- Updated base image from `node:22-alpine` to `node:24-alpine`
- [x] `package.json` -- Updated all dependency versions to latest stable: next 16.2.3, react/react-dom 19.2.5, typescript 6.0.2, node-appwrite 23.1.0, zod 4.3.6, @hookform/resolvers 5.2.2, lucide-react 1.8.0, eslint 9.39.4 (kept at 9.x — ESLint 10 incompatible with eslint-plugin-react), eslint-config-next 16.2.3, @types/node ^24.12.2. Removed @eslint/eslintrc (no longer needed). Updated overrides for @types/react 19.2.14 and @types/react-dom 19.2.3
- [x] `package-lock.json` -- Regenerated via `npm install`
- [x] `next.config.ts` -- No changes needed; Next.js 16 config options are compatible
- [x] `tsconfig.json` -- Auto-updated by Next.js 16: `jsx` changed to `react-jsx`, added `.next/dev/types/**/*.ts` to includes
- [x] `eslint.config.mjs` -- Rewrote to use native flat config arrays from `eslint-config-next/{core-web-vitals,typescript}` (FlatCompat removed)
- [x] `src/lib/appwrite/server.ts` -- No changes needed; Client/Databases/Storage/Users/ID/Query API unchanged in v23
- [x] `src/lib/auth/auth-service.ts` -- No changes needed; Account/Client API unchanged
- [x] `src/app/actions/*.ts` -- Changed `Models.Document` to `Models.DefaultDocument` in competition-actions.ts, music-file-actions.ts, user-actions.ts
- [x] `scripts/setup-appwrite.ts` + `scripts/setup-appwrite-simple.ts` -- Changed `IndexType` to `DatabasesIndexType`
- [x] `src/components/dashboard/competitor/upload-music.tsx` -- Fixed Zod 4 `required_error` → `error`; changed `Models.Document` to `Models.DefaultDocument`
- [x] All lucide-react consumers -- Verified: all icon names (Music, Upload, Headphones, User, LogOut, FileMusic, UserCog, Play, Square, Loader2, AlertCircle, Check, ChevronDown, ChevronUp, Trophy, Users, Database, RefreshCw, Filter, Trash, Plus, Pencil, X, Shield, ShieldAlert, Search, CheckCircle2, XCircle, Download, Trash2) remain valid in v1.8.0
- [x] `_bmad-output/project-context.md` -- Updated all version numbers and added notes about breaking changes
- [x] `package.json` lint script -- Changed from `next lint` (removed in Next.js 16) to `eslint src/`

**Acceptance Criteria:**
- Given the updated dependencies, when running `npm run build`, then the build completes with zero errors
- Given the updated dependencies, when running `npm run lint`, then linting passes with zero errors
- Given the updated Dockerfile, when inspecting the base image, then it uses `node:24-alpine`
- Given the updated node-appwrite SDK, when running setup scripts, then Appwrite client initialization succeeds without import/API errors
- Given all version bumps, when reviewing `_bmad-output/project-context.md`, then documented versions match `package.json`

## Design Notes

**Upgrade order matters.** Execute in this sequence to minimize cascading breakage:
1. Dockerfile (Node 24) — infrastructure foundation
2. `package.json` versions — all at once, then `npm install`
3. Next.js 16 config adjustments
4. TypeScript 6 adjustments
5. node-appwrite v23 API changes across all consuming files
6. Zod 4 + resolvers 5 changes
7. lucide-react v1 icon name verification
8. ESLint 10 config adjustments
9. Build + lint verification
10. Documentation update

**node-appwrite v15 -> v23 is the highest-risk change.** The SDK version tracks the Appwrite server API version, so 8 major bumps likely means significant API surface changes. All files importing from `node-appwrite` must be audited.

## Verification

**Commands:**
- `npm run build` -- expected: clean build, zero errors
- `npm run lint` -- expected: clean lint, zero errors
- `node --version` -- expected: confirms Node 24.x available in dev environment (informational)

## Suggested Review Order

**Dependency versions & infrastructure**

- All version bumps in one place — start here to see the full scope
  [`package.json:19`](../../../package.json#L19)

- Node 24 base image for Docker builds
  [`Dockerfile:1`](../../../Dockerfile#L1)

**Appwrite SDK v23 migration**

- IndexType → DatabasesIndexType import + usage in main setup script
  [`setup-appwrite.ts:13`](../../../scripts/setup-appwrite.ts#L13)

- Same rename across simple setup script (10 usages)
  [`setup-appwrite-simple.ts:11`](../../../scripts/setup-appwrite-simple.ts#L11)

- Models.Document → DefaultDocument for paginated document arrays
  [`competition-actions.ts:31`](../../../src/app/actions/competition-actions.ts#L31)

- Same change in music file actions
  [`music-file-actions.ts:50`](../../../src/app/actions/music-file-actions.ts#L50)

- Same change in user actions
  [`user-actions.ts:34`](../../../src/app/actions/user-actions.ts#L34)

**Zod v4 + form schema migration**

- required_error → error; Competition/Grade interfaces extend DefaultDocument
  [`upload-music.tsx:43`](../../../src/components/dashboard/competitor/upload-music.tsx#L43)

**ESLint config rewrite**

- Native flat config arrays replace FlatCompat wrapper; lint script now calls eslint directly
  [`eslint.config.mjs:1`](../../../eslint.config.mjs#L1)

**Config auto-updated by Next.js 16**

- jsx changed to react-jsx; .next/dev/types added to includes
  [`tsconfig.json:18`](../../../tsconfig.json#L18)

**Documentation**

- Version numbers and breaking-change notes updated throughout
  [`project-context.md:20`](../../project-context.md#L20)

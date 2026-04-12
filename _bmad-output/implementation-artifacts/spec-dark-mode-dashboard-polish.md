---
title: 'Dark Mode Dashboard Polish'
type: 'bugfix'
created: '2026-04-12'
status: 'done'
route: 'one-shot'
baseline_commit: 'c15c0dd270d5b62154d0a5c736074baa533d6c76'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

# Dark Mode Dashboard Polish

## Intent

**Problem:** The initial dark-mode rollout left a small set of dashboard screens with hard-coded light surfaces, most visibly in admin competition management, both profile tabs, and the competitor upload flow. Those light cards, selectors, overlays, and helper panels break contrast and make the dark-default experience look unfinished.

**Approach:** Patch the remaining screen-specific light-only classes with dual-theme variants, preserving each screen's existing accent colors while making selected cards, select triggers, loading states, profile chrome, and upload helper content render correctly in dark mode.

## Suggested Review Order

**Admin Competitions**

- Selected competition cards and delete states no longer flash light backgrounds.
  [`competition-card.tsx:100`](../../src/components/dashboard/admin/competition-card.tsx#L100)

- Year and grade filters now use theme-aware triggers and option text.
  [`competition-list.tsx:88`](../../src/components/dashboard/admin/competition-list.tsx#L88)

- Grade tables and inline edit rows keep indigo contrast in dark mode.
  [`grade-management.tsx:228`](../../src/components/dashboard/admin/grade-management.tsx#L228)

- The competitions shell and empty states match the dark dashboard panels.
  [`competition-management.tsx:131`](../../src/components/dashboard/admin/competition-management.tsx#L131)

**Profile Panels**

- Admin profile shell, footer, and role chip now render dark-aware surfaces.
  [`admin/profile-management.tsx:162`](../../src/components/dashboard/admin/profile-management.tsx#L162)

- Competitor profile fixes the remaining light overlay, footer, and role badge states.
  [`competitor/profile-management.tsx:158`](../../src/components/dashboard/competitor/profile-management.tsx#L158)

**Competitor Upload**

- Competition, category, and grade selectors stay dark while data is still loading.
  [`upload-music.tsx:292`](../../src/components/dashboard/competitor/upload-music.tsx#L292)

- The naming-convention helper panel and code sample now use theme-aware containers.
  [`upload-music.tsx:635`](../../src/components/dashboard/competitor/upload-music.tsx#L635)

**Shared Loading**

- Reused inline loading cards no longer drop bright panels into dark screens.
  [`local-loading-card.tsx:18`](../../src/components/ui/local-loading-card.tsx#L18)

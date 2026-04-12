---
title: 'Default Dark Mode with Persistent Theme Toggle'
type: 'feature'
created: '2026-04-12'
status: 'done'
baseline_commit: '40ad8fa46ba81aaada8ddbd2cce30252fa1f41c2'
context:
  - '{project-root}/_bmad-output/project-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app already defines dark palette tokens in global CSS, but the rendered experience still behaves like a light-only interface with many hard-coded light surfaces. Users have no way to switch themes, and the current shell does not remember a preference across reloads or navigation.

**Approach:** Add a lightweight app-level theme system that defaults first-time visitors to dark mode, lets users toggle between dark and light from the navbar, and persists that choice so the server-rendered shell can honor it before paint. Update the main shared and first-visit surfaces that still hard-code light styling so the application feels deliberate and readable in both themes.

## Boundaries & Constraints

**Always:** Default to dark mode when no prior preference exists; persist an explicit user choice in a way the root layout can read during server render; place the theme toggle immediately to the left of the login/logout button; preserve existing login, logout, menu, and redirect behavior; keep implementation dependency-free; ensure the landing page, auth pages, dashboard shells, toasts, and loading overlays remain readable in both themes.

**Ask First:** Persisting theme preference into Appwrite user data instead of local browser state; expanding the scope beyond the mapped high-traffic screens if additional low-traffic admin panels need a separate follow-up pass.

**Never:** Add a third-party theming package; tie theme persistence to auth-only server actions; remove the existing brand gradients entirely; accept a light flash on initial paint when dark is the default; ship a mixed state where cards, menus, or form text become unreadable in one theme.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Default first visit | No stored theme preference | Root layout renders in dark mode by default, and the navbar toggle reflects dark mode without a flash of light theme | N/A |
| Returning visitor | Persisted preference is `light` or `dark` | The same theme is applied on reload and after route changes | N/A |
| Toggle while logged in or logged out | User clicks the theme toggle beside the auth button | Theme changes immediately, the choice is persisted, and the login/logout menu still opens and works normally | If persistence fails, keep the in-page theme change and fail silently apart from non-blocking console logging |
| High-traffic themed surfaces | Landing, auth, dashboard, toast, or loading UI rendered in either theme | Text contrast, borders, backgrounds, and accent treatments remain legible and visually consistent | N/A |

</frozen-after-approval>

## Code Map

- `src/app/layout.tsx` -- server-rendered root shell that can read persisted theme state and apply the initial document class.
- `src/app/globals.css` -- existing theme tokens and base styles; needs semantic dark-default refinements and any supporting utility styles.
- `src/components/layout/navbar.tsx` -- current location of the login/logout control; owns final placement for the new theme toggle.
- `src/app/page.tsx` -- public landing page with prominent hard-coded light gradients, cards, and CTA styling.
- `src/app/(auth)/layout.tsx` -- auth shell container that already hints at dark support and should be aligned with the new default theme system.
- `src/app/(auth)/login/page.tsx` -- login form copy, labels, and actions currently use light-only text and button styles.
- `src/app/(auth)/register/page.tsx` -- register form has the same light-only styling issues as login.
- `src/components/ui/loading-overlay.tsx` -- shared loading state is fixed to white card and gray text.
- `src/components/ui/toast.tsx` -- toast variants use light-only backgrounds and text.
- `src/app/admin/dashboard/page.tsx` -- admin landing shell contains welcome banner, tabs, and cards with light-only surfaces.
- `src/components/dashboard/competitor/competitor-dashboard.tsx` -- competitor landing shell mirrors the admin shell and should stay visually consistent.

## Tasks & Acceptance

**Execution:**
- [x] `src/app/layout.tsx` -- read the persisted theme preference, apply dark-by-default document state, and expose the initial theme to client UI -- prevents hydration mismatch and first-paint flash.
- [x] `src/components/layout/navbar.tsx` and a new colocated toggle helper if needed -- add a theme toggle immediately left of the auth button, update the live document theme on click, and persist the chosen theme without disrupting the existing user menu flow.
- [x] `src/app/globals.css` -- finalize semantic surface styles so dark mode is the default baseline while light mode remains supported and branded.
- [x] `src/components/ui/loading-overlay.tsx` and `src/components/ui/toast.tsx` -- convert shared feedback UI from light-only colors to dual-theme styling so status messages still read correctly.
- [x] `src/app/page.tsx`, `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, and `src/app/(auth)/register/page.tsx` -- replace hard-coded light-only shells and typography with theme-aware styling on first-visit and authentication screens.
- [x] `src/app/admin/dashboard/page.tsx` and `src/components/dashboard/competitor/competitor-dashboard.tsx` -- update the primary post-login dashboard wrappers so both user roles get coherent dark/light support.

**Acceptance Criteria:**
- Given no saved theme preference, when any page loads, then the application renders in dark mode by default and the navbar toggle shows the dark-state affordance.
- Given a user switches themes from the navbar while logged in or logged out, when they refresh the page or navigate to another route, then their chosen theme remains active and the login/logout control still behaves exactly as before.
- Given a user views the landing page, auth pages, admin dashboard shell, competitor dashboard shell, loading overlay, or toast notifications in either theme, when those surfaces render, then backgrounds, text, borders, and accent elements remain legible and visually intentional.

## Spec Change Log

## Design Notes

Use a server-readable persisted preference, not client-only transient state, because the root layout is server-rendered and should apply the correct theme before the page paints. The client toggle can still update `document.documentElement` immediately for responsiveness, but the persisted source of truth must also be available on the next server render.

## Verification

**Commands:**
- `npm run lint` -- expected: updated theme changes pass the existing lint gate.
- `npm run build` -- expected: production build succeeds without hydration or dynamic rendering regressions.

**Manual checks (if no CLI):**
- Open `/`, `/login`, `/register`, `/dashboard`, and `/admin/dashboard`; confirm dark is the default when no preference exists, the toggle sits to the left of the auth control, and switching themes persists after refresh and navigation.

## Suggested Review Order

**Theme State**

- Server resolves a cookie-backed default before render to avoid theme flash.
  [app/layout.tsx:33](../../src/app/layout.tsx#L33)

- Centralize theme names, fallback logic, and cookie lifetime in one place.
  [theme.ts:1](../../src/lib/theme.ts#L1)

- Navbar owns the toggle, cookie writes, and client/server theme sync.
  [navbar.tsx:31](../../src/components/layout/navbar.tsx#L31)

**Shared Surfaces**

- Base gradients and reusable panels make dark mode the default shell.
  [globals.css:134](../../src/app/globals.css#L134)

- Toast variants now render readable status styling in both themes.
  [toast.tsx:9](../../src/components/ui/toast.tsx#L9)

- Loading overlays use the same glass panel treatment as the shell.
  [loading-overlay.tsx:1](../../src/components/ui/loading-overlay.tsx#L1)

**Public And Auth**

- The landing page now uses theme-aware hero, cards, and CTA treatments.
  [app/page.tsx:38](../../src/app/page.tsx#L38)

- Auth routes inherit a shared panel shell instead of a light-only card.
  [auth/layout.tsx:7](../../src/app/(auth)/layout.tsx#L7)

- Login swaps hard-coded light colors for theme-aware typography and controls.
  [login/page.tsx:87](../../src/app/(auth)/login/page.tsx#L87)

- Registration mirrors the same dark-first treatment as login.
  [register/page.tsx:108](../../src/app/(auth)/register/page.tsx#L108)

**Dashboard Coverage**

- Admin shell and tabs adopt the shared banner and panel system.
  [admin/page.tsx:31](../../src/app/admin/dashboard/page.tsx#L31)

- Competitor shell mirrors the same dashboard treatment for consistency.
  [competitor-dashboard.tsx:18](../../src/components/dashboard/competitor/competitor-dashboard.tsx#L18)

- The default admin tab converts filters, table states, and actions for dark mode.
  [music-file-management.tsx:383](../../src/components/dashboard/admin/music-file-management.tsx#L383)

- The default competitor tab now themes badges, filters, and empty states.
  [my-files.tsx:167](../../src/components/dashboard/competitor/my-files.tsx#L167)

- Audio controls keep admin and competitor actions readable in both themes.
  [audio-player-button.tsx:199](../../src/components/ui/audio-player-button.tsx#L199)

# Requirements: Unified header component

## Problem

The app currently has two separate pieces of header-like chrome:

1. A static (non-fixed) top bar in `apps/web/app/layout.tsx`, mounted on every route, showing an "Awards" link and a theme toggle button, right-aligned, no left-side content.
2. A home-page-only sticky header (`apps/web/components/sticky-header.tsx`) that fades/slides into view once the home page's hero card has fully scrolled out of view, showing "Thanks, Claude" on the left and `HeaderAuthControl` (avatar/role badges/logout) on the right.

This creates inconsistent header behavior across routes: some header content appears on every page (Awards, theme toggle), while other content (login info) only appears on the home page after scrolling. The user experiences different header information depending on which page they're on and how far they've scrolled.

## Solution

Replace the two separate header elements with one unified header component that acts as the single source of truth for header content and behavior across the entire app. Mount it globally in the root layout so it's present on every route. Keep it always fixed to the top of the viewport (not conditionally fixed), with content that changes visibility based on route and scroll state according to specific rules.

## Actors

Any logged-in user of the app, browsing any route (`/`, `/admin`, `/awards`, `/admin/roles`, `/admin/users`).

## Done looks like

- **One unified header component** replaces both the static bar in `layout.tsx` and `sticky-header.tsx` entirely
- The component is mounted globally in `layout.tsx`, so it's present and consistently styled on every route
- Header is always `position: fixed` at the top of the viewport on every route, never conditionally fixed
- Every route's content has top padding added (sized to the header's height) so page content isn't hidden underneath the fixed overlay
- Header shows, left to right: "Thanks, Claude" (project name) — Awards link — theme toggle — `HeaderAuthControl`
- **Content visibility rules:**
  - "Thanks, Claude" + Awards link + theme toggle: always visible immediately on every route, including home
  - `HeaderAuthControl`: on the home page, stays hidden until the hero card has fully scrolled out of the viewport, then fades in (matches today's existing sticky-header reveal logic). On every other route, shown immediately from the start, unconditionally.
- On the home page, the hero card's own `HeaderAuthControl` (in its title bar) remains unchanged and unmodified — it's visible before the hero scrolls out of view, then off-screen once scrolled. The global header's copy is hidden until that same scroll moment. No duplicate interactive controls ever visible at the same time.
- Smooth fade and slide transitions when `HeaderAuthControl` appears and disappears (same animation style as today's sticky header)

## Boundaries

- **The unified header is the only header/chrome component** — `sticky-header.tsx` is deleted entirely
- **No changes to `HeaderAuthControl`'s or `ThemeToggle`'s internal logic** — both reused as-is
- **No new npm dependencies** (React Context is built into React, already in use via the framework)
- **All five existing routes** are affected and must account for the new fixed header (`/`, `/admin`, `/awards`, `/admin/roles`, `/admin/users`); no new routes are being added
- **No changes to the hero card's title-bar `HeaderAuthControl`** in `apps/web/app/page.tsx` — it stays exactly as it is today

## Environment notes

- `apps/web/app/layout.tsx` today: a static (non-fixed) `<header className="flex items-center justify-end gap-4 px-6 py-4">` containing a `<Link href="/awards">Awards</Link>` and `<ThemeToggle />`, no left-side content. Wraps `{children}` and is mounted on every route via the root layout.
- `apps/web/components/sticky-header.tsx` today: home-page-only, `position: fixed top-0 inset-x-0 z-50` bar with `flex items-center justify-between`, showing "Thanks, Claude" (left, plain text span) + `<HeaderAuthControl />` (right). Visibility is a `visible: boolean` prop driven by `useIsScrolledPast(heroRef)`, a hook co-located in the same file using the native `IntersectionObserver` API: `!entry.isIntersecting && entry.boundingClientRect.bottom < 0` (distinguishes "scrolled fully past, above viewport" from "not yet scrolled to, below viewport"). Visible/hidden states toggle Tailwind transform/opacity classes (`-translate-y-full opacity-0 pointer-events-none` vs `translate-y-0 opacity-100`) with `transition-transform transition-opacity duration-300 ease-in-out`. Root element always stays mounted (never conditionally unmounted) and has `aria-hidden={!visible}`.
- `HeaderAuthControl` (`apps/web/components/header-auth-control.tsx`) is used in exactly two places today: the hero card's title bar in `apps/web/app/page.tsx` and in `sticky-header.tsx`. It is not used on `/admin`, `/awards`, `/admin/roles`, or `/admin/users` today.
- All routes in the app: `/` (home, `apps/web/app/page.tsx`), `/admin` (`apps/web/app/admin/page.tsx`), `/awards` (`apps/web/app/awards/page.tsx`), `/admin/roles` (`apps/web/app/admin/roles/page.tsx`), `/admin/users` (`apps/web/app/admin/users/page.tsx`).
- No React Context (`createContext`/`useContext`) is used anywhere in `apps/web` today except inside shadcn/ui library internals — the new `HeroVisibilityContext` establishes the first app-level Context usage in this codebase.
- This plan follows on from a prior, now-archived plan at `.gh-workflows/plans/done/20260814_094428-sticky-header-on-scroll/`, whose spec explicitly built `sticky-header.tsx` as a separate, additive, home-page-only element to avoid touching `layout.tsx`'s top bar. This new plan supersedes that boundary by deliberate, explicit user request.
- No test framework other than Playwright e2e exists in `apps/web` (no component/unit test runner configured).

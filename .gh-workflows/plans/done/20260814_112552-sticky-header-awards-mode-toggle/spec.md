## Problem Statement

The app currently has two separate, inconsistent pieces of header chrome: a static top bar in `apps/web/app/layout.tsx` (Awards link + theme toggle, mounted on every route, no branding), and a home-page-only sticky header (`apps/web/components/sticky-header.tsx`) that only appears once the hero card has scrolled fully out of view, showing the project name and login info. Awards and theme access are missing from the sticky header, and there's no single, consistent header experience across the app — some routes show no login info at all, and the two header pieces don't share markup or behavior.

## Solution

Replace both existing header pieces with one unified header component (`SiteHeader`), mounted once in `apps/web/app/layout.tsx`, always fixed to the top of the viewport on every route. It shows "Thanks, Claude", the Awards link, and the theme toggle immediately on every route. Login info (`HeaderAuthControl`) shows immediately on every route except the home page, where it continues to defer to the existing hero-card-scroll trigger — hidden until the hero card has fully scrolled out of view, then fading in, exactly matching today's behavior.

## Implementation Decisions

- New component `apps/web/components/site-header.tsx` (or an equally clear name chosen during implementation) replaces both `apps/web/app/layout.tsx`'s current `<header>` JSX and `apps/web/components/sticky-header.tsx` (deleted in ticket 2).
- Mounted once in `apps/web/app/layout.tsx`, wrapping every route.
- Always `position: fixed`, pinned to the top of the viewport, on every route (not conditionally fixed). Page content on every route needs top padding added (at the layout level, sized to the header's height) so nothing renders hidden underneath the fixed overlay.
- Content, left to right: "Thanks, Claude" (project name text) — Awards link — theme toggle — `HeaderAuthControl` (avatar/role badges/logout).
- "Thanks, Claude" + Awards link + theme toggle: always visible immediately, on every route, including the home page — never gated behind any scroll trigger.
- `HeaderAuthControl`: on the home page only, stays hidden until the hero card has fully scrolled out of the viewport, then fades in — the same trigger `sticky-header.tsx` uses today (native `IntersectionObserver`, computing `!entry.isIntersecting && entry.boundingClientRect.bottom < 0` on a ref to the hero card's outer container). On every other route (`/admin`, `/awards`, `/admin/roles`, `/admin/users`), `HeaderAuthControl` shows immediately, unconditionally, from the start — new behavior, since none of these routes show login info today.
- New `HeroVisibilityContext` (React Context, e.g. via a `HeroVisibilityProvider`) wraps the header and `{children}` in `layout.tsx`. Its default state is "hero not visible" / "show login" — so any route that never touches the context automatically shows login. The home page's scroll-detection hook (the existing `useIsScrolledPast` logic, evolved) reports hero-visibility into this context via a setter, instead of driving a local `visible` prop passed to a locally-rendered component like today. This is the first app-level React Context usage in this codebase (see ADR-001 in `grill/`).
- The home page's hero card keeps its own separate `HeaderAuthControl` instance in its title bar, completely unchanged — it's visible only before the hero scrolls out of view, exactly when the global header's own copy is still hidden, so the two are never simultaneously visible. No dedup work needed.
- `apps/web/components/sticky-header.tsx` is deleted (ticket 2). Its `useIsScrolledPast` hook / `IntersectionObserver` logic is folded into the new unified header (or a new co-located hook), rewired to write into `HeroVisibilityContext` instead of controlling a locally-owned `visible` prop.
- Reuses `HeaderAuthControl`, `ThemeToggle`, and the existing Awards `Link` exactly as they are today — no changes to their internals.
- No new npm dependencies (React Context is built into React, already in use via the framework).

## Testing Decisions

- No component/unit test framework exists in `apps/web` today — Playwright e2e remains the only available seam, same as prior header work in this codebase.
- Ticket 1 updates existing e2e specs that assert on the old static-header markup or the absence of login info on non-home routes: `apps/e2e/tests/dark-mode-toggle.spec.ts`, `apps/e2e/tests/awards-page.spec.ts`, `apps/e2e/tests/admin-navigation.spec.ts`, `apps/e2e/tests/admin-roles-page.spec.ts`, `apps/e2e/tests/admin-users-page.spec.ts`, `apps/e2e/tests/auth-flow.spec.ts` — updating selectors/assertions to match the new header markup and the new "login always visible on these routes" behavior.
  - Also affected: `apps/e2e/tests/story-feed-avatars.spec.ts`. Once the global `SiteHeader` mounts a second, always-present `HeaderAuthControl` on the home route (alongside the hero card's own unchanged copy), the home page has two simultaneous Login/Log out controls, so this spec's bare `page.getByRole("button", { name: "Login" })` queries became strict-mode violations. Fixed by scoping to `page.getByTestId("site-header")` and scrolling past the hero first, so the assertions/clicks target the global header's copy — a necessary consequence of the header consolidation, not unrelated scope creep.
- Ticket 2 rewrites `apps/e2e/tests/sticky-header.spec.ts` against the new unified header on the home route: navigate to `/`, assert login is hidden and brand/Awards/theme are visible before scrolling past the hero card, scroll past it, assert login fades in, scroll back up, assert it hides again.
  - Implemented as `apps/e2e/tests/home-header-scroll.spec.ts` (new file) with `sticky-header.spec.ts` deleted, rather than an in-place edit — the underlying component the old file was named after (`sticky-header.tsx`) was itself deleted and replaced by `SiteHeader`, so the rename keeps the spec file's name aligned with what it now tests. Coverage is equivalent-or-better: it retains the old file's pre/post-scroll opacity assertions and adds the brand/Awards/theme-toggle pre-scroll visibility checks the old file never had.

## Out of Scope

- Any change to `HeaderAuthControl`'s or `ThemeToggle`'s internal logic — reused as-is.
- Any new npm dependencies.
- Any route beyond `/`, `/admin`, `/awards`, `/admin/roles`, `/admin/users` (no others currently exist).

## Further Notes

None.

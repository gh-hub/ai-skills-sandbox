# Context: Sticky header awards mode toggle

## What we're building
Replace two separate header elements (the static top bar in layout.tsx and the home-page-only sticky header) with one unified header component mounted globally, always fixed to the top, with route-and-scroll-specific content visibility rules — a single source of truth for all header content and behavior across every route.

## Key decisions
- One unified header component replaces both layout.tsx bar and sticky-header.tsx ([grill/decisions.md](grill/decisions.md))
- Always fixed on every route, with page padding applied to all content
- Route-specific visibility: Awards/theme toggle always visible; login info hidden on home until scroll, shown elsewhere
- React Context (HeroVisibilityContext) for cross-tree scroll-state plumbing ([grill/ADR-001.md](grill/ADR-001.md)) — first app-level Context usage
- No new npm dependencies; reuse IntersectionObserver pattern from prior sticky-header plan
- Tickets:
  - 01: Build SiteHeader + HeroVisibilityContext, mount in layout.tsx, update non-home-route e2e specs
  - 02: Wire home-page scroll detection to context, delete sticky-header.tsx, rewrite home e2e spec

## Completed tickets
- 01: Global unified header — done ([notes/implement-01.md](PROGRESS/notes/implement-01.md))
- 02: Home hero-scroll wiring — done ([notes/implement-02-home-hero-scroll-wiring.md](PROGRESS/notes/implement-02-home-hero-scroll-wiring.md)).
  Hook wiring, sticky-header.tsx deletion, and e2e spec rewrite were already complete; this
  session fixed the remaining e2e gap by loosening the `IntersectionObserver` trigger in
  `useReportHeroVisibility` (`rootMargin: "-40px 0px 0px 0px"`, relying on `entry.isIntersecting`
  directly) instead of requiring literal full clearance past y=0. Also fixed two small
  pre-existing test bugs found along the way (an infinite-recursion helper in
  `auth-flow.spec.ts`, a missing scroll step in `story-feed-avatars.spec.ts`). Full e2e suite
  (59/59, run twice for determinism), typecheck, and build are all green.

## Current state
Phase: review/round-3 (not yet started)
Current ticket: (none)

## Review diff-command note
This plan's `Base branch` equals the current branch (`small-tasks-workflow`) — no separate feature branch was created for this quick plan, so `git diff {base}...HEAD` would be empty (no divergent commits). The actual diff under review is the uncommitted working-tree diff. Use `git diff HEAD -- apps/` to scope to application code (excludes this plan's own bookkeeping files under `.gh-workflows/plans/`).

## Review round 1 — FAIL (fixed)
3 spec-match findings, no security findings, all checks (typecheck/build/e2e) green. See [review/round-1/findings.md](review/round-1/findings.md). Fix tickets 01-03 (all done, single session — see [PROGRESS/notes/implement-review-round-1-fixes.md](PROGRESS/notes/implement-review-round-1-fixes.md)):
1. `01-theme-toggle-assertion.md` — done: added missing theme-toggle visibility assertion to `home-header-scroll.spec.ts` (scoped to `page.getByTestId("site-header")`, targeting the `ThemeToggle`'s `aria-label="Toggle theme"` accessible name)
2. `02-story-feed-avatars-scope-note.md` — done: confirmed the `story-feed-avatars.spec.ts` edit was necessary (the global `SiteHeader`'s always-present `HeaderAuthControl` creates a second Login/Log out button on home, so bare role queries became strict-mode violations) — no code change, `spec.md` updated to list this file among ticket-1-affected specs
3. `03-sticky-header-spec-rename-note.md` — done: confirmed `home-header-scroll.spec.ts` is a superset of the deleted `sticky-header.spec.ts`'s coverage (same opacity-fade assertions plus new pre-scroll brand/Awards/theme checks) — no code change, `spec.md` updated to reference the new filename

Full e2e suite rerun once at the end of the fix session: **59/59 passed**, no flakes.

Ready for review round 2 (not yet started — no round-2 findings exist).

## Review round 2 — FAIL (fixed)
2 spec-match findings, no security findings, all checks (typecheck/build/e2e) green. See [review/round-2/findings.md](review/round-2/findings.md). Fix tickets (both done, single session — see [PROGRESS/notes/implement-review-round-2-fixes.md](PROGRESS/notes/implement-review-round-2-fixes.md)):
1. `01-home-load-flash-fix.md` — done: real regression fixed — login control could briefly render visible on home-page load before the IntersectionObserver's first async callback corrected `heroVisible` (context default `false` is right for non-home routes, wrong for home's true initial state). Fixed by switching `useReportHeroVisibility`'s effect (`apps/web/lib/hero-visibility-context.tsx`) from `useEffect` to `useLayoutEffect` and adding a synchronous `setHeroVisible(isHeroOnScreen(element))` call — using a small helper built on `getBoundingClientRect()` that mirrors the observer's `rootMargin: "-40px 0px 0px 0px"` threshold — before the `IntersectionObserver` is set up. The observer itself is unchanged and still owns all subsequent scroll-driven updates. Non-home routes are unaffected since `useReportHeroVisibility` is only called from the home page.
2. `02-remove-debug-console-logging.md` — done: removed leftover `page.on("console", ...)` debug forwarding from `home-header-scroll.spec.ts`.

Full e2e suite rerun once at the end of the fix session: **59/59 passed**, no flakes. Typecheck and build both clean.

Ready for review round 3 (not yet started — no round-3 findings exist).

## Plan complete

This plan is now archived. All phases (grill, spec, tickets, implement 01-02, review rounds 1-3 with fixes) are complete. The unified global header is now live across all routes with proper scroll-based visibility control.

## Load this session
- [PROGRESS/notes/implement-review-round-2-fixes.md](PROGRESS/notes/implement-review-round-2-fixes.md) — what changed for both round-2 fix tickets and the final verification results
- [PROGRESS/notes/implement-review-round-1-fixes.md](PROGRESS/notes/implement-review-round-1-fixes.md) — what changed for all 3 round-1 fix tickets and the final e2e result
- [PROGRESS/notes/implement-02-home-hero-scroll-wiring.md](PROGRESS/notes/implement-02-home-hero-scroll-wiring.md) — full history: original root-cause investigation, the rootMargin fix, and final green verification
- Relevant coding rules: see [.claude/skills/gh-dev-workflow/coding-rules/INDEX.md](../../../.claude/skills/gh-dev-workflow/coding-rules/INDEX.md) if available, otherwise generic TypeScript/React conventions

## Gotchas
- The prior plan (.gh-workflows/plans/done/20260814_094428-sticky-header-on-scroll/) is archived but established `sticky-header.tsx` as a separate, additive element. This new plan *supersedes* that boundary by consolidating both the layout.tsx bar and sticky-header.tsx into one unified component — an explicit, user-requested change in direction.
- The hero card's own `HeaderAuthControl` in its title bar (apps/web/app/page.tsx) stays completely unchanged — only the global headers change.
- The header's default context state must be "show login" (true) so non-home routes need zero extra logic to display login info.
- The hero card's own `HeaderAuthControl` copy must NOT be removed during ticket 02 — it stays in the hero title bar, independent from the global header's login visibility wiring.
- **E2E environment fragility (resolved)**: in this sandbox's Docker/Playwright environment, the home page's total scrollable range was ~31px short of what's needed to fully scroll the hero card out of the viewport at the default 1280x720 viewport, so the original literal `bottom < 0` scroll-past-hero trigger never fired (confirmed identical on the pre-ticket-01 `sticky-header.tsx` too, so it wasn't a regression). Resolved by giving the `IntersectionObserver` in `useReportHeroVisibility` a `rootMargin: "-40px 0px 0px 0px"` and triggering on `entry.isIntersecting` directly — comfortably exceeds the ~31px deficit without requiring literal y=0 clearance. Kept here for historical context in case a future environment shows a larger deficit.
- **Home-load flash / `useLayoutEffect` (resolved, round-2 fix-01)**: `IntersectionObserver`'s first callback is asynchronous — even on the home route where the hero is genuinely on screen at mount, `HeroVisibilityContext`'s shared `useState(false)` default (correct for every other route) briefly governed the login control's visibility until that first callback fired, causing a real render-then-correct flash. `useEffect` would not have fixed this — it also runs after the browser paints. `useLayoutEffect` does run before paint (after DOM commit), so pairing it with a synchronous `getBoundingClientRect()`-based initial check (`isHeroOnScreen`, mirroring the observer's own `rootMargin: "-40px 0px 0px 0px"` threshold) closes the gap entirely for the client-rendered case. If a future change makes `SiteHeader`/`page.tsx` server components (they're currently `"use client"`), re-check whether an SSR/hydration mismatch reopens; wasn't needed here.

# Implement notes: 01-retarget-hero-trigger-and-reorder-header

## What was built

1. **`apps/web/app/page.tsx`** — Moved `ref={heroRef}` from the outer hero card
   div (`overflow-hidden rounded-lg border ... font-mono text-sm`) to the inner
   top-bar div (`flex items-center gap-2 border-b ... px-4 py-3`, the one with
   the traffic-light dots, the `<h1>Thanks, Claude (code)</h1>`, and its own
   `<HeaderAuthControl />`). No other changes to this file.
   `hero-visibility-context.tsx` was left completely untouched, as required.

2. **`apps/web/components/site-header.tsx`** — Wrapped the Awards `<Link>` and
   `<ThemeToggle />` in a single `<div className="flex items-center gap-4">`
   and conditionally added `order-last` to that wrapper when `heroVisible` is
   `true`. The `header-auth-fade` login-control slot keeps its default
   (unset/`order: 0`) order, untouched.
   - When `heroVisible` is `false` (default / every non-home route): wrapper
     has no `order` class → `order: 0`, ties with the login slot's `order: 0`,
     tie broken by DOM order → wrapper (Awards + toggle) renders first, exactly
     as today.
   - When `heroVisible` is `true`: wrapper gets `order-last` (Tailwind's
     `order: 9999`) → sorts after the login slot's `order: 0` → Awards + toggle
     render after the login-control slot.
   - No transition/animation added to the reorder itself — only the existing
     `transition-transform transition-opacity` on the login slot remains, and
     that's untouched.

3. **`apps/e2e/tests/home-header-scroll.spec.ts`** —
   - Replaced the `window.scrollTo(0, document.body.scrollHeight)` trigger
     with a new `scrollJustPastHeroTopBar(page)` helper that locates the hero's
     top-bar element by its heading text (`"Thanks, Claude (code)"`, via
     `closest("div")` from the `<h1>`), reads its `getBoundingClientRect().bottom`
     + `scrollY`, and scrolls 1px past that — so the test tracks the new,
     earlier trigger point and won't silently drift if hero markup changes.
   - Kept the existing test (renamed slightly: "hero's top bar" instead of
     "hero card") using the new helper.
   - Added a new `test(...)` block asserting the Awards link's and
     `Toggle theme` button's bounding-box `x` is greater than the
     `header-auth-fade` wrapper's `x` while hidden, and less than it once
     shown — scoped to `page.getByTestId("site-header")` throughout, per the
     file's existing comment about the hero's own separate `HeaderAuthControl`
     copy.

## Verification

- **Typecheck**: `pnpm exec tsc --noEmit -p tsconfig.json` in both `apps/web`
  and `apps/e2e` — both exit 0, no errors.
- **E2E**: Docker was available in this sandbox, so the full stack
  (`docker compose ... up --build` for `web`, `api`, `postgres`, per
  `apps/e2e/playwright.config.ts`'s `webServer`) was actually built and run via
  `npx playwright test tests/home-header-scroll.spec.ts` from `apps/e2e`.
  Result: **2 passed (51.0s)**, exit code 0. Both the retargeted scroll-trigger
  test and the new order-flip assertions pass against the real app.

## Judgment calls / gotchas

- The ticket allowed either extending the existing test or adding a new
  `test(...)` block — chose to add a second `test(...)` block for the
  order-flip assertions, since it's a distinct behavior/concern from the
  fade-opacity test and reads more clearly split out.
- Used Tailwind's `order-last` (`order: 9999`) on the Awards+ThemeToggle
  wrapper and left the login slot's `order` unset (default `0`), rather than
  giving the login slot an explicit `order-first`/`order-none` — this was
  simpler (one conditional class instead of two) and satisfies the spec's
  explicit note that "the login-control slot itself keeps its current `order`
  (unset/default)."
- Removed a stray blank line introduced by the `page.tsx` edit (between the
  opening top-bar `<div>` tag and its first child) — purely cosmetic, no
  behavior change.

## What review needs to know

- Base branch for this plan: `small-tasks-workflow` (set in
  `PROGRESS/INDEX.md` this session, per this being ticket 01).
- All acceptance criteria in
  `tickets/01-retarget-hero-trigger-and-reorder-header.md` are checked off.
- No infra blockers — e2e ran for real, not skipped. If review re-runs e2e,
  expect the same `docker compose up --build` cost (~roughly a minute total
  including container startup) before tests execute.
- Files changed: `apps/web/app/page.tsx`, `apps/web/components/site-header.tsx`,
  `apps/e2e/tests/home-header-scroll.spec.ts`. No other files touched.

# Implement notes: review-round-1-fix-01-fix-duplicate-interactive-header-e2e

## What was changed

`apps/web/components/sticky-header.tsx`: added `aria-hidden={!visible}` to the sticky
header's root `<div>` (the same element carrying `data-testid="sticky-header"` and the
existing transition classes), toggled alongside the existing `visible` prop:

```tsx
<div
  data-testid="sticky-header"
  aria-hidden={!visible}
  className={cn(
    "fixed top-0 inset-x-0 z-50 flex items-center justify-between border-b border-border bg-card/95 px-6 py-3 font-mono text-sm backdrop-blur transition-transform transition-opacity duration-300 ease-in-out",
    visible
      ? "translate-y-0 opacity-100"
      : "-translate-y-full opacity-0 pointer-events-none"
  )}
>
```

No other changes were needed — `aria-hidden` only affects the accessibility tree, not
visual rendering, so the existing slide+fade CSS transition (`transition-transform`,
`transition-opacity`, `duration-300`) and the `IntersectionObserver`-based
`useIsScrolledPast` hook were left untouched, per the ticket's guidance.

`tabIndex`-equivalent exclusion / `inert` were considered but not needed — `aria-hidden`
alone was sufficient to resolve the Playwright role-query collision (Playwright's
`getByRole` respects `aria-hidden`, matching the ticket's expectation).

## Verification results

1. **Typecheck**: `cd apps/web && npx tsc --noEmit -p tsconfig.json` — clean, no errors.
2. **Build**: `cd apps/web && pnpm build` (`next build`) — passed, 8/8 static pages
   generated successfully, no warnings/errors introduced.
3. **E2E (full suite)**: `cd apps/e2e && pnpm test` (Docker-orchestrated via
   `docker compose --env-file apps/e2e/.env.e2e -p thanks-claude-e2e up --build`) — ran to
   completion in ~1.5 minutes.
   - **Result: 59 passed, 0 failed** (exit code 0).
   - Specifically confirmed passing (all previously-broken specs from round 1, now green):
     - `admin-navigation.spec.ts` — 9/9 passed
     - `admin-roles-page.spec.ts` — 9/9 passed
     - `admin-users-page.spec.ts` — 9/9 passed
     - `auth-flow.spec.ts` — 8/8 passed
     - `story-feed-avatars.spec.ts` — 2/2 passed
     - `sticky-header.spec.ts` — 1/1 passed
   - All other pre-existing specs (awards-page, dark-mode-toggle, like-flow, smoke,
     stats-band, story-award-picker, story-feed, story-form-flow) also passed —
     no unrelated regressions.
   - This resolves all 33 tests that were broken in review round 1 due to the duplicate
     interactive `HeaderAuthControl` (strict-mode `getByRole` collisions).
4. **Docker teardown**: confirmed clean — `docker ps -a --filter name=thanks-claude-e2e`
   showed no containers after the test run's own teardown; ran
   `docker compose --env-file apps/e2e/.env.e2e -p thanks-claude-e2e down` as a safety
   net, which reported "No resource found to remove" (i.e. already torn down).

## Ticket status

All 4 acceptance criteria in
`review/round-1/tickets/01-fix-duplicate-interactive-header-e2e.md` are checked off and
satisfied. Ticket status updated to `done`.

## What review round 2 needs to know

- The only file changed in this fix round is `apps/web/components/sticky-header.tsx`
  (one line added: `aria-hidden={!visible}`). No other files were touched.
- Full e2e suite is green (59/59). Typecheck and build are clean.
- The fix is minimal and additive — no changes to the `IntersectionObserver` hook, no
  changes to `layout.tsx` or `header-auth-control.tsx`, no new dependencies.
- No open ambiguity or deviations from the ticket's prescribed approach — `aria-hidden`
  alone was sufficient; `inert`/`tabIndex` fallback was not needed.
- Docker containers were cleanly torn down; no lingering `thanks-claude-e2e` resources.

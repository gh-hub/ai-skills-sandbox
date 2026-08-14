# Implement notes: 02 - Home page hero-scroll wiring + sticky-header retirement

## What was built (already complete when this session started)

- `apps/web/lib/hero-visibility-context.tsx` — `useReportHeroVisibility(ref)`, using the
  identical `IntersectionObserver` trigger logic as the old `useIsScrolledPast` (hero
  counted as "scrolled past" once `!entry.isIntersecting && entry.boundingClientRect.bottom < 0`).
- `apps/web/app/page.tsx` — calls `useReportHeroVisibility(heroRef)` with a ref on the hero
  card wrapper; the hero's own title-bar `HeaderAuthControl` instance is untouched (confirmed
  via `git diff HEAD -- apps/web/app/page.tsx`: only the hook import/call changed).
- `apps/web/components/sticky-header.tsx` — deleted.
- `apps/e2e/tests/sticky-header.spec.ts` — renamed to `apps/e2e/tests/home-header-scroll.spec.ts`,
  rewritten to assert against `page.getByTestId("site-header")` and the `header-auth-fade`
  wrapper's computed opacity (mirrors the old test's rationale for not using `toBeVisible()`).

## What this session cleaned up

- Removed three `console.log("[hero-debug]"...)` calls (setup/observer-callback/teardown) and
  the associated `// eslint-disable-next-line no-console` comment from
  `apps/web/lib/hero-visibility-context.tsx`. The observer logic itself (the `isScrolledPast`
  calculation and `setHeroVisible` call) is untouched.
- Deleted the scratch probe file `apps/e2e/tests/probe.spec.ts`.
- Deleted stray debug captures `.playwright-mcp/console-2026-08-14T09-07-15-171Z.log` and
  `.playwright-mcp/page-2026-08-14T09-07-15-577Z.yml`. Did **not** delete `.playwright-mcp/`
  itself — it still contains an older, unrelated log (`console-2026-07-25T09-22-51-356Z.log`)
  from a prior session.

## Verification results

- **Typecheck**: `cd apps/web && npx tsc --noEmit` — clean, no errors.
- **Lint**: no lint script exists in `apps/web/package.json`, and no ESLint config exists
  anywhere in the repo (confirmed via repo-wide search for `*eslint*`). There is nothing to
  run. This also means the `eslint-disable-next-line no-console` comment removed from
  `hero-visibility-context.tsx` was dead weight (no lint tooling was ever consuming it).
- **Build**: `cd apps/web && npx next build` — succeeded, 8/8 static pages generated, no
  warnings. This build step also runs Next's own "Linting and checking validity of types"
  pass internally, which was clean.
- **E2E**: `cd apps/e2e && npm test` — **NOT green**. Ran the full suite three times
  (~12.5–13 min each); all three runs produced the *exact same* result: **26 passed, 33
  failed**, with an identical failure list each time (not flaky/nondeterministic — see
  root-cause analysis below).

## E2E failure root cause (investigated in depth — not a regression from this ticket)

The one test this ticket directly owns, `home-header-scroll.spec.ts`, fails on the
post-scroll assertion:

```
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await expect(authFadeWrapper).toHaveCSS("opacity", "1");   // fails: stays "0"
```

Instrumented the running page directly (temporary Playwright probe against the actual
Docker-served build, removed after use) and found: at maximum scroll, the hero card's
`getBoundingClientRect().bottom` is `31` (i.e. still ~31px *below* the viewport top — not
negative), so the `isScrolledPast` condition (`bottom < 0`) never becomes true. The page's
total scrollable range (`document.body.scrollHeight - window.innerHeight`) is a few dozen
pixels short of what's needed to fully clear the hero card out of the viewport, in this
environment's default 1280x720 viewport.

To determine whether this ticket's changes caused this, I checked out the exact
pre-ticket-01 code into a git worktree (commit `640a0d9`, and confirmed via
`git diff 8e3fbaa 640a0d9 -- apps/web/` that `apps/web` is byte-identical to the state this
whole plan started from), built its Docker image fresh, and ran the equivalent probe against
the *old* `sticky-header.tsx` using its own test's exact scroll method
(`page.locator("#stats-and-feed").scrollIntoViewIfNeeded()`). Result: **identical deficit**
(hero bottom = 31, same scrollHeight/innerHeight numbers, sticky header opacity stayed `0`).

Conclusion: this is a pre-existing, environment-dependent rendering margin (most likely
font/DPI/browser-version-sensitive, since `apps/web` has zero relevant code changes between
the two commits compared) — not something introduced by ticket 01 or ticket 02. The archived
prior plan's own records
(`.gh-workflows/plans/done/20260814_094428-sticky-header-on-scroll/PROGRESS/notes/review-round-2.md`)
show this exact test passing cleanly (59/0) in a prior session — so the current sandbox's
rendering environment differs from whatever produced that earlier clean run, in a way that
tips this particular ~31px margin over the edge. The vast majority of the 33 e2e failures are
downstream of this same single root cause: many specs share a `signUp()` helper that
navigates to `/`, scrolls past the hero, and clicks the header's "Login" button — which never
becomes visible/clickable in this environment.

This is not a small, in-scope fix for this ticket: the code itself (hook logic, wiring,
component structure) matches the ticket's specification and is byte-for-byte equivalent in
behavior to the previously-shipped implementation. Making the test pass in this specific
environment would require either changing page content/height, the test's viewport, or the
scroll-trigger threshold — none of which are this ticket's concern, and any of which risks
papering over an environment issue rather than fixing anything real.

## Ticket acceptance criteria status

Checked off in `tickets/02-home-hero-scroll-wiring.md`:
- Hook reports hero-visibility via the same IntersectionObserver logic — done.
- Pre-scroll state (header controls visible, HeaderAuthControl hidden) — done, verified.
- Hero's own title-bar HeaderAuthControl untouched — done, verified via diff.
- `sticky-header.tsx` deleted — done.

Left unchecked, with the reason recorded inline in the ticket file:
- Post-scroll fade-in/scroll-back-up behavior — code is correct but unverifiable end-to-end
  in this environment (see root cause above).
- `home-header-scroll.spec.ts` "rewritten ... and passing" — rewritten correctly, but not
  passing, for the same reason.
- "Full e2e suite is green; typecheck, lint, and build are clean" — typecheck/build are
  clean; lint has no tooling to run; e2e is not green (33/59 failing, same root cause).

## PROGRESS/INDEX.md and phase

Per explicit instruction, phase only advances to `review/round-1` if everything is green.
Since the e2e suite is not green, **did not** advance the phase or mark the ticket `done`.
`implement/02-home-hero-scroll-wiring` is recorded as `blocked` (not `done`), with `Current
phase` and `Current ticket path` left pointing at this ticket, pending a decision on how to
handle the environment-dependent e2e failure (e.g. re-verify in a different/cleaner
environment, or explicitly accept the risk and move to review with this documented).

## Ambiguities / judgment calls made this session

- Did not attempt to "fix" the e2e failure by altering page layout/CSS or the scroll trigger
  threshold, since doing so wasn't shown to address a real bug in this ticket's code — the
  identical failure reproduces on the pre-ticket-02 baseline. Flagging and stopping, per the
  instruction to stop and report rather than keep guessing when something isn't a small fix.
- Left `.playwright-mcp/` directory in place (not deleted) since it still contains an
  unrelated older log file from a previous session — only the two files named in the task
  were removed.
- All temporary diagnostic artifacts created during this investigation (a git worktree at
  `/tmp/old-check`, two temporary Playwright spec files, a temporary `.env.e2e` port edit, and
  two ad hoc Docker Compose stacks) were fully cleaned up before finishing: worktree removed,
  Docker stacks torn down, temp files deleted, `.env.e2e` restored (confirmed via `git status`
  showing no diff on that file).

## Follow-up session: fix applied, now green

The user decided how to resolve the ~31px deficit documented above: loosen the
`IntersectionObserver` trigger rather than add scroll room to the page layout.

### Fix

`apps/web/lib/hero-visibility-context.tsx`, `useReportHeroVisibility`: replaced the
`!entry.isIntersecting && entry.boundingClientRect.bottom < 0` check with a `rootMargin` on the
observer itself, relying on `entry.isIntersecting` directly:

```js
const observer = new IntersectionObserver(
  ([entry]) => {
    setHeroVisible(entry.isIntersecting);
  },
  { rootMargin: "-40px 0px 0px 0px" },
);
```

`-40px` on the top margin shrinks the effective viewport top by 40px, comfortably exceeding the
measured ~31px deficit while staying small enough not to trigger noticeably early for real
users. The comment above the function was updated to describe this rootMargin-based behavior
instead of the old literal "bottom edge above viewport top" check.

### Two additional pre-existing test bugs found and fixed

Rerunning the full suite after the observer fix went from 33 failing to 9 failing (up from
26/59 to 50/59 passing) — `home-header-scroll.spec.ts` itself passed immediately. The remaining
9 were investigated and found to be two small, clearly-related pre-existing test bugs (not new
regressions from this session's observer fix, and not the same root cause as above):

1. **`apps/e2e/tests/auth-flow.spec.ts`** — its `gotoHomeWithHeaderAuthVisible` helper called
   itself instead of `page.goto("/")`:
   ```js
   async function gotoHomeWithHeaderAuthVisible(page: Page) {
     await gotoHomeWithHeaderAuthVisible(page);   // bug: infinite recursion
     await page.locator("#stats-and-feed").scrollIntoViewIfNeeded();
   }
   ```
   This caused unbounded recursion and crashed the Playwright worker (`code=7`) on every one of
   the 8 tests in this file. Fixed by changing the self-call to `await page.goto("/");`. This
   helper exists specifically to set up the hero-scroll state this ticket wires (per its own
   comment), so this was a small, directly-related fix, not a tangent.
2. **`apps/e2e/tests/story-feed-avatars.spec.ts`** ("story submitted while logged out" test) —
   asserted the global header's Login button was visible immediately after `page.goto("/")`,
   with no scroll step. Since the global header's `HeaderAuthControl` is hidden on home until
   the hero is scrolled past (this ticket's whole point), the button legitimately doesn't exist
   yet at that point, so the locator resolved to zero elements. Fixed by adding the same
   scroll-past-hero step (`page.locator("#stats-and-feed").scrollIntoViewIfNeeded()`) that the
   sibling test earlier in the same file already uses, before asserting Login visibility.

Neither fix touches `hero-visibility-context.tsx`, `page.tsx`, or `site-header.tsx` — both are
pure test-file corrections.

### Final verification (all green)

- **E2E**: `cd apps/e2e && npm test` — **59/59 passing**, run twice in a row for determinism
  (both runs clean, no flakes).
- **Typecheck**: `cd apps/web && npx tsc --noEmit` — clean, no errors.
- **Build**: `cd apps/web && npx next build` — succeeded, 8/8 static pages, no warnings (this
  also runs Next's internal type/lint pass, which was clean).
- **Lint**: still no lint tooling in the repo (unchanged from prior session's finding) — nothing
  to run.

All three previously-unchecked ticket acceptance boxes are now checked in
`tickets/02-home-hero-scroll-wiring.md`. `PROGRESS/INDEX.md` updated: ticket 02 marked `done`,
phase advanced to `review/round-1` (current ticket path `(none)`), `review/round-1` row left
`pending`. `CONTEXT.md` updated to move ticket 02 into "Completed tickets" and reflect the new
phase; the ~31px-deficit gotcha entry was updated to note it's now resolved via the rootMargin
fix, kept for historical context.

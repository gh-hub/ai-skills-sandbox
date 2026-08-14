# Implement: review round 1 fixes (all 3 tickets, single session)

Review round 1 (see [../../review/round-1/findings.md](../../review/round-1/findings.md)) failed with 3
spec-match findings (no security findings; typecheck/build/e2e all passed). All 3 were trivially
small, so all 3 fix tickets were implemented in this one session rather than one-per-session.

## Fix 01 — theme-toggle assertion ([review/round-1/tickets/01-theme-toggle-assertion.md](../../review/round-1/tickets/01-theme-toggle-assertion.md))

`apps/e2e/tests/home-header-scroll.spec.ts` asserted the brand text ("Thanks, Claude") and the
Awards link were visible pre-scroll, but never asserted the theme toggle — spec's Testing
Decisions require all three ("brand/Awards/theme"). Added:

```ts
await expect(
  siteHeader.getByRole("button", { name: "Toggle theme" })
).toBeVisible();
```

right after the existing brand/Awards assertions, scoped to `page.getByTestId("site-header")`
exactly like those two and like the existing pattern in `dark-mode-toggle.spec.ts`. The
`ThemeToggle` component (`apps/web/components/theme-toggle.tsx`) exposes `aria-label="Toggle theme"`
on its `Button`, giving it an accessible name via role query — no new testid needed.

## Fix 02 — story-feed-avatars.spec.ts scope note ([review/round-1/tickets/02-story-feed-avatars-scope-note.md](../../review/round-1/tickets/02-story-feed-avatars-scope-note.md))

Reviewed `git diff HEAD -- apps/e2e/tests/story-feed-avatars.spec.ts`. Confirmed the edit (a
`siteHeader()` helper + scroll-past-hero calls before Login/Log out assertions) was a necessary
consequence of the header consolidation, not scope creep: once the global `SiteHeader` mounts an
always-present `HeaderAuthControl` on the home route (alongside the hero card's own, unchanged
copy), the home page has two simultaneous Login/Log out buttons, so the spec's original bare
`page.getByRole("button", { name: "Login" })` queries became Playwright strict-mode violations.
Scoping to `page.getByTestId("site-header")` and scrolling past the hero first (so the assertions
target the now-visible global-header copy) fixes this — the same pattern already used in
`dark-mode-toggle.spec.ts`.

No code change needed (the existing edit was correct and necessary). Updated `spec.md`'s Testing
Decisions to list `story-feed-avatars.spec.ts` alongside the other ticket-1-affected specs, with
the rationale above.

## Fix 03 — sticky-header.spec.ts rename note ([review/round-1/tickets/03-sticky-header-spec-rename-note.md](../../review/round-1/tickets/03-sticky-header-spec-rename-note.md))

Compared `git show HEAD:apps/e2e/tests/sticky-header.spec.ts` (deleted file) against
`apps/e2e/tests/home-header-scroll.spec.ts` (new file). The old file only asserted pre-scroll
opacity 0, post-scroll opacity 1, and opacity 0 again on scroll-back-up for the (then-separate)
sticky header. The new file retains that exact opacity-based fade assertion (now on the
`header-auth-fade` wrapper inside the global `SiteHeader`) and additionally asserts brand/Awards
link/theme-toggle visibility pre-scroll (theme-toggle assertion added in fix 01 above) — a strict
superset of the old file's coverage. The rename itself is justified by the underlying component
rename (`sticky-header.tsx` → `SiteHeader`), keeping the spec filename aligned with what it tests.

Confirmed as an accepted deviation with no functional test gap. No code change needed. Updated
`spec.md`'s Testing Decisions to reference `home-header-scroll.spec.ts` instead of
`sticky-header.spec.ts`, with a note that this reflects the underlying component rename.

## Final verification

Ran the full e2e suite once at the end (`cd apps/e2e && npm test`): **59 passed** (was 59/59
before this session too — fix 01 is additive, fixes 02/03 were doc-only). No flakes observed.

## Ticket status

All 3 round-1 fix tickets' acceptance criteria are checked off (`- [x]`) in their respective
files under `review/round-1/tickets/`.

## Next

Phase advances to `review/round-2` (not yet started). No round-2 findings exist yet.

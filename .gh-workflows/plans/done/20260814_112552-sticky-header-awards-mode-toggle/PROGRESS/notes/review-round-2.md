# Review round 2 — notes

**Verdict: FAIL**

- Spec match: 2 findings — see [review/round-2/findings.md](../../review/round-2/findings.md#spec-match)
  1. Real regression: brief flash-of-wrong-content — the login control can render visible for a moment on home-page load before the `IntersectionObserver`'s first async callback corrects `heroVisible`, because the context's default (`false`, needed for non-home routes) doesn't match the home route's true initial state (hero genuinely on screen)
  2. Leftover debug console-forwarding (`page.on("console", ...)`) in `home-header-scroll.spec.ts`, not part of the spec's described coverage
- Security: no findings.
- Checks: typecheck pass, build pass (8/8 static pages), lint N/A, unit/integration N/A, e2e pass (59/59, reused from the round-1 fix session's rerun — no code changed since, not rerun fresh in this gate).

Full detail in [review/round-2/findings.md](../../review/round-2/findings.md). Two fix tickets written to `review/round-2/tickets/`. Round 2 (≤2), so no user input needed — looping back to `implement` automatically.

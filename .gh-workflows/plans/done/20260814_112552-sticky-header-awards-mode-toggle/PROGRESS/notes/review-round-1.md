# Review round 1 — notes

**Verdict: FAIL**

- Spec match: 3 findings — see [review/round-1/findings.md](../../review/round-1/findings.md#spec-match)
  1. Missing theme-toggle visibility assertion in `home-header-scroll.spec.ts`
  2. `story-feed-avatars.spec.ts` edited outside ticket 1's enumerated file list (likely necessary, needs confirmation + spec.md update)
  3. `sticky-header.spec.ts` → `home-header-scroll.spec.ts` rename vs. spec's "rewrite in place" wording (likely fine, needs confirmation + spec.md update)
- Security: no findings.
- Checks: typecheck pass, build pass (8/8 static pages), lint N/A (no tooling), unit/integration N/A (no framework), e2e pass (59/59, reused from the implement session's rerun — no code changed since, not rerun fresh in this gate).

Full detail in [review/round-1/findings.md](../../review/round-1/findings.md). Three fix tickets written to `review/round-1/tickets/`, numbered 01-03. Since this is round 1 (≤2), no user input needed — looping back to `implement` automatically per the plan's ticket-cap rules (review-round fix tickets are never capped, regardless of count).

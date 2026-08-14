# Review Round 1: Summary

**Outcome:** FAIL

**Root issue:** `apps/web/components/sticky-header.tsx` keeps `HeaderAuthControl` mounted and interactive at all times, only visually hidden via CSS (opacity/transform). This creates duplicate "Login" buttons in the DOM and accessibility tree, breaking 33 pre-existing Playwright tests across `admin-navigation.spec.ts`, `admin-roles-page.spec.ts`, `admin-users-page.spec.ts`, `auth-flow.spec.ts`, and `story-feed-avatars.spec.ts` — all use role-based locators that now resolve to 2 elements instead of 1 (Playwright strict-mode violation).

**Sub-agent findings:**
- Spec-match: clean (all items correctly implemented)
- Security: clean (purely presentational feature, no injection/auth/data-flow risks)
- Build: PASS (`next build` successful, 8/8 pages)
- Lint/unit: N/A (no tooling configured)
- E2E: FAIL (deterministic, 33 tests broken, confirmed via 2 full runs)

**Fix strategy:** Add `aria-hidden={!visible}` to the sticky header's root element, toggled alongside the existing `visible` prop, to exclude it from the accessibility tree when hidden. This preserves the CSS transition (aria-hidden does not affect visual rendering) while resolving the Playwright role-query collision.

**Next ticket:** [review/round-1/tickets/01-fix-duplicate-interactive-header-e2e.md](../review/round-1/tickets/01-fix-duplicate-interactive-header-e2e.md)

**Full detail:** See [../review/round-1/findings.md](../review/round-1/findings.md)

**Round:** 1 of 2 auto-fix rounds — will loop back to implement automatically per this skill's rules (no user checkpoint needed for round ≤ 2).

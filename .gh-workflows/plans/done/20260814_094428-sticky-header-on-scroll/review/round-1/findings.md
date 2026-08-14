# Review Round 1 Findings

## Spec match

No findings. The spec-match sub-agent confirmed: all spec items implemented correctly (sticky header component with correct classes, `useIsScrolledPast` hook co-located as specified, `heroRef` wired to the hero container, `StickyHeader` rendered before `<main>`, e2e test follows the described flow). No scope creep — only the three expected files changed (`apps/web/app/page.tsx`, `apps/web/components/sticky-header.tsx`, `apps/e2e/tests/sticky-header.spec.ts`); `layout.tsx` and `header-auth-control.tsx` untouched, matching the spec's boundaries. One non-blocking note: the hook signature uses `RefObject<HTMLElement | null>` rather than the spec's literal `RefObject<HTMLElement>`, required by React 19 types — functionally identical, not a deviation.

## Security

No findings. The diff is a purely presentational feature (client-side scroll visibility via IntersectionObserver, no user input, no network calls, no auth logic). No data flow from user-controlled input into any injection/XSS/auth/access-control/secrets/SSRF/crypto/CSRF sink across the three changed files.

## Checks

| Check | Result |
|---|---|
| Lint | N/A — no lint tooling configured in this project |
| Build | PASS — `next build` (static export) compiled successfully, 8/8 pages |
| Unit/integration tests | N/A — no test framework configured in `apps/web` |
| E2E | **FAIL (deterministic — confirmed via 2 full fresh runs, not flaky)** |

### E2E failure detail

Ran the full Playwright suite twice (`pnpm test` in `apps/e2e`). Both runs: identical **33 failed, 26 passed**, same test names and error signatures both times.

**Root cause:** `apps/web/components/sticky-header.tsx` unconditionally renders `<HeaderAuthControl />` at all times — the sticky header is only visually hidden via `opacity-0`/`-translate-y-full`/`pointer-events-none`, never removed from the DOM or accessibility tree. This means the page has **two "Login" buttons present simultaneously** in the accessibility tree (one in the sticky header, one in the main content). Any test using `getByRole("button", { name: "Login" })` (Playwright's idiomatic locator) now throws a strict-mode violation resolving to 2 elements instead of 1.

This newly broke 33 pre-existing tests across 5 spec files (all previously passing before this change):
- `admin-navigation.spec.ts` (7 tests)
- `admin-roles-page.spec.ts` (8 tests)
- `admin-users-page.spec.ts` (8 tests)
- `auth-flow.spec.ts` (8 tests)
- `story-feed-avatars.spec.ts` (2 tests)

Representative failure (identical in both runs):
```
Error: locator.click: Error: strict mode violation: getByRole('button', { name: 'Login' }) resolved to 2 elements:
    1) <button ...>Login</button> aka getByTestId('sticky-header').getByRole('button', { name: 'Login' })
    2) <button ...>Login</button> aka getByRole('main').getByRole('button', { name: 'Login' })
```

Note: the sticky header's own e2e test (`apps/e2e/tests/sticky-header.spec.ts`) already correctly asserts via `toHaveCSS("opacity", ...)` rather than `toBeVisible()`, and passes in both runs — this specific test itself is fine. The regression is the duplicate-interactive-element side effect on *other* pre-existing tests.

**Rerun confirmation:** Run 2 reproduced the exact same 33 failing test names and error signatures as Run 1 — genuine failure, not flaky.

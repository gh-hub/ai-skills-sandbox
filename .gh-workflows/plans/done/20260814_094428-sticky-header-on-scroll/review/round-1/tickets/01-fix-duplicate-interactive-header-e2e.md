# 01 — [e2e] Fix duplicate interactive HeaderAuthControl breaking 33 e2e tests

**What to build:** `apps/web/components/sticky-header.tsx` currently keeps `HeaderAuthControl` fully mounted and interactive at all times, only visually hidden via `opacity-0`/`-translate-y-full`/`pointer-events-none`. This leaves two "Login" (and, when logged in, two avatar/Admin-link/roles/logout) controls simultaneously present in the DOM and accessibility tree, which breaks 33 pre-existing Playwright tests across `admin-navigation.spec.ts`, `admin-roles-page.spec.ts`, `admin-users-page.spec.ts`, `auth-flow.spec.ts`, and `story-feed-avatars.spec.ts` (all use `getByRole("button", { name: "Login" })` or similar role-based locators that now match 2 elements instead of 1 — a Playwright strict-mode violation).

Fix so that when the sticky header is hidden, it (and its `HeaderAuthControl`) is excluded from the accessibility tree — while preserving the existing CSS slide+fade transition (no abrupt pop-in/out). The most direct fix: add `aria-hidden={!visible}` (and ideally `tabIndex={-1}`-equivalent exclusion, though `aria-hidden` alone should resolve the Playwright role-query collision since Playwright's `getByRole` respects `aria-hidden`) to the sticky header's root element, toggled alongside the existing `visible` prop. Verify this doesn't interfere with the CSS transition (aria-hidden does not affect visual rendering).

**Blocked by:** None — can start immediately

**Status:** done

- [x] Sticky header's root element has `aria-hidden="true"` when `visible` is false, and no `aria-hidden` (or `aria-hidden="false"`) when `visible` is true — implemented via `aria-hidden={!visible}` in `apps/web/components/sticky-header.tsx`
- [x] The slide+fade CSS transition still works correctly in both directions (not broken by the `aria-hidden` change) — `aria-hidden` only affects the accessibility tree, not visual rendering/CSS; existing transition classes untouched. Confirmed via `sticky-header.spec.ts` passing (asserts `toHaveCSS("opacity", ...)`).
- [x] Re-run the full Playwright suite (`pnpm test` in `apps/e2e`, via Docker) and confirm all previously-passing tests pass again — specifically `admin-navigation.spec.ts`, `admin-roles-page.spec.ts`, `admin-users-page.spec.ts`, `auth-flow.spec.ts`, `story-feed-avatars.spec.ts`, and the new `sticky-header.spec.ts` — all 59 tests passed (0 failed), including all 33 previously-broken tests across the 5 named spec files plus `sticky-header.spec.ts`. Full run: `59 passed (1.5m)`.
- [x] `next build` still passes — confirmed, 8/8 static pages generated successfully

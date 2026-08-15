# Review round 1 — findings

## Spec match

- **Missing/partial requirement — no test coverage for the disabled-while-pending behavior.** Spec's Testing Decisions section says: "buttons are disabled while `logout.isPending`." The new e2e test (`clicking Log out shows a confirm dialog; Cancel keeps the session, Yes, log out ends it` in `auth-flow.spec.ts`) covers dialog-opens, Cancel-closes-with-no-mutation, and Yes-triggers-mutation, but never asserts that "Cancel" or "Yes, log out" become `disabled` during the pending window. The implementation itself does wire `disabled={logout.isPending}` on both buttons in `logout-confirm-modal.tsx` — the code is correct, the test just doesn't verify it.
- **No scope creep found.** All changes are scoped to the ticket: the new modal, the `header-auth-control.tsx` wiring, and the `helpers.ts` `logout()` addition.
- **Implemented-but-wrong: the spec's own "no explicit close needed" assumption is false, and this breaks real usage.** Spec says: "On success: no explicit close needed — `HeaderAuthControl` already unmounts this view once `me.data` becomes `null`." This is incorrect. `HeaderAuthControl` is a single component instance that conditionally returns either an anonymous-view subtree or an authenticated-view subtree depending on `me.data` — the component itself never unmounts across that switch, so its `isLogoutModalOpen` `useState` is preserved across a logout/login cycle. Sequence that reproduces it:
  1. User logs in, clicks "Log out" → `isLogoutModalOpen` becomes `true`, `LogoutConfirmModal` mounts and shows.
  2. User clicks "Yes, log out" → `logout.mutate()` succeeds → `me.data` becomes `null` → `HeaderAuthControl` re-renders into its anonymous-view branch → `LogoutConfirmModal` (a child) unmounts, so the dialog visually disappears. But `isLogoutModalOpen` itself, living in the *parent*, is never reset to `false`.
  3. User logs back in (same session, no page reload) → `me.data` becomes populated again → `HeaderAuthControl` re-renders into its authenticated-view branch, remounting `<LogoutConfirmModal open={isLogoutModalOpen} ...>` with the stale `open={true}` from before → the confirm dialog spuriously reopens immediately after login.
  4. Radix's Dialog marks the rest of the page `aria-hidden` while open, so the "Log out" button (and everything else in the header) becomes inaccessible/not-visible until the user notices and dismisses a dialog they never asked for.

  This is not merely a missing test — it's a real, reproduced product bug (confirmed by e2e failure below, reproduced twice, not flaky) caused by trusting the spec's incorrect unmount assumption instead of explicitly resetting modal state on success.

## Security

No findings. Reviewed `logout-confirm-modal.tsx` (new), `header-auth-control.tsx`, `helpers.ts`, and `auth-flow.spec.ts` diffs against the standard vulnerability baseline (injection, auth/session handling, access control, sensitive data exposure, misconfiguration, XSS, insecure deserialization, vulnerable dependencies, input validation, SSRF, path traversal, crypto, CSRF). This is a client-side confirmation gate wrapping the existing `useLogout()` mutation — no new auth/session logic, no new endpoints, no new input handling. Two non-blocking observations, neither exploitable: dismiss/Escape/overlay-click only closes via `onOpenChange` (no logout without the explicit "Yes, log out" click); the dialog has no server-side counterpart, so it doesn't change the app's existing CSRF/session posture for the logout mutation either way.

## Checks (step 4)

| Check | Result |
|---|---|
| Lint | Skipped — no lint script or config exists anywhere in this repo (root `package.json` has no `lint` script; no ESLint config found) |
| Build | **Pass** — `pnpm run build` in `apps/web` (`next build`) completed clean, all routes compiled and prerendered |
| Unit/integration tests | Skipped — `apps/web` has no unit/component test framework (no jest/vitest, no `.test.tsx` files); already documented as a correction in ticket 01 |
| E2E tests | **Fail** — `pnpm run test` in `apps/e2e` (`playwright test`): 60 passed, 1 failed: `tests/auth-flow.spec.ts:68:5 › logging in with an existing account, then logging out, restores the Login button`. Rerun once in isolation (`npx playwright test tests/auth-flow.spec.ts -g "restores the Login button"`) — failed identically both times, same assertion, same root cause (see Spec match section above). Not flaky. |

## Decision

**FAIL** — one non-flaky e2e failure caused by a real bug (stale `isLogoutModalOpen` state surviving a logout/login cycle), plus one missing test-coverage gap for the pending-disabled requirement. No security findings; build is clean.

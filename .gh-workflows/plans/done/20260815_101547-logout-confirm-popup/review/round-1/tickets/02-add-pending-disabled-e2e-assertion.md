# 02 — [spec] Add e2e coverage for buttons disabled while logout is pending

**What's wrong:** Spec's Testing Decisions section requires verifying "buttons are disabled while `logout.isPending`." The implementation already wires `disabled={logout.isPending}` on both "Cancel" and "Yes, log out" in `apps/web/components/logout-confirm-modal.tsx` (this part is correct) — but no test in `apps/e2e/tests/auth-flow.spec.ts` asserts it, so this requirement currently has no coverage.

**Blocked by:** Ticket 01 in this round (fix the stale-modal-state bug first, so this addition lands on a green suite rather than layering onto the known-broken test)

**Status:** ready

- [x] In the `"clicking Log out shows a confirm dialog; Cancel keeps the session, Yes, log out ends it"` test, after clicking "Yes, log out", assert both "Cancel" and "Yes, log out" are disabled during the pending window before the mutation resolves. If the mutation resolves too fast in this test environment to reliably observe the pending state, note that constraint inline and use whatever seam is actually observable (e.g. asserting disabled immediately after the click, before awaiting any post-mutation state) rather than skipping the assertion.

  Satisfied via `page.route("**/api/auth/logout", ...)` interception (in `apps/e2e/tests/auth-flow.spec.ts`, inline in this test only — the shared `logout()` helper in `helpers.ts` was left untouched), holding the response for 500ms before `route.continue()`. The real logout endpoint in this stack resolves too fast for a synchronous immediately-after-click assertion to reliably catch the pending state, so route interception (a standard Playwright pattern for testing loading/pending UI) was used instead of an artificial app-level delay. Verified with two consecutive full-file reruns of `auth-flow.spec.ts`, both green (9/9 passed).

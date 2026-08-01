# 03 — [spec] Remove leftover debug test artifacts

**What to build:** Delete `apps/e2e/tests/repro.spec.ts` entirely (leftover debug spec: stray `console.log`s, a placeholder "third signup" test with no assertions, and near-duplicate coverage of `admin-users-page.spec.ts`). Remove the debug `console.log` (and its `eslint-disable-next-line no-console`) from `apps/api/src/apps/users/users.spec.ts`'s `signupUser` test helper (~line 61-62).

**Blocked by:** None — can start immediately

**Status:** ready

- [x] `apps/e2e/tests/repro.spec.ts` no longer exists
- [x] No debug `console.log` remains in `users.spec.ts`'s signup helper
- [x] All other tests in both files still pass (repro.spec.ts deleted outright, so N/A there; `users.spec.ts` full suite: 29/29 pass)

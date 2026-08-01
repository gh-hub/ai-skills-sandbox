# 05 — [e2e] Fix uniqueEmail() local-part length bug in admin e2e specs

**What to build:** `uniqueEmail(label)` in both `apps/e2e/tests/admin-roles-page.spec.ts` and `apps/e2e/tests/admin-users-page.spec.ts` produces a local-part that exceeds the 64-character RFC 5321 limit enforced by `class-validator`'s `@IsEmail()` whenever an admin-named label is used, causing signup to silently 400 and every dependent test to time out waiting for "Log out" to appear. Fix both files' `uniqueEmail()` to use a short prefix (matching the fix already applied in `apps/e2e/tests/admin-navigation.spec.ts`'s short `e2e-` prefix) so the local-part always stays under 64 characters regardless of label length.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] All 3 tests in `admin-roles-page.spec.ts` pass
- [ ] All 3 tests in `admin-users-page.spec.ts` pass
- [ ] No test's generated email exceeds the 64-character local-part limit

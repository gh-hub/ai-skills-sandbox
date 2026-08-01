# 06 — [e2e] Fix ambiguous ADMIN locator regression in auth-flow.spec.ts

**What to build:** `apps/e2e/tests/auth-flow.spec.ts:153`'s "a user granted ADMIN sees an ADMIN badge next to their name in the header" test now fails: this diff's new header "Admin" nav link (`<a href="/admin">Admin</a>`) collides with the existing role badge (`<span>ADMIN</span>`) under Playwright's default case-insensitive `getByText("ADMIN")` matching (strict-mode violation, 2 elements found). Scope the test's locator so it unambiguously targets only the role badge (e.g. `getByText("ADMIN", { exact: true })` scoped within the roles list container, or a more specific role/testid-based locator on the badge itself) without touching the new nav link's behavior.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `auth-flow.spec.ts:153` passes without a strict-mode violation
- [ ] The fix only changes the test's locator, not the app's rendered markup (unless the badge needs a `data-testid` added for reliable scoping, which is also acceptable)

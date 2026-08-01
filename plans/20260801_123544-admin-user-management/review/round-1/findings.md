# Review round 1 — findings

## Spec match

- **No shared `isAdmin(user)` helper.** Spec: "Gating: a shared `isAdmin(user)` helper drives header link + each admin page's own check." `apps/web/components/admin-gate.tsx` and `apps/web/components/admin-nav-link.tsx` each independently inline the identical check (`me.data.roles.includes(ADMIN_ROLE)`), duplicated rather than extracted into the required shared helper.

- **Built-in role deletion returns the wrong status code.** Spec: "built-in role always rejected as bad request regardless of force" and the API contract table: "400 if built-in". `apps/api/src/apps/roles/roles.service.ts`'s `remove()` throws `ConflictException` (409) when `role.isBuiltIn`, not `BadRequestException` (400) (confirmed at line ~33: `throw new ConflictException(\`Built-in role "${role.name}" cannot be deleted\`);`). This wrong contract is baked into the tests too — `apps/api/src/apps/roles/roles.spec.ts` asserts `.expect(409)` for "rejects deleting the ADMIN built-in role" and the OPERATOR equivalent, so the bug doesn't surface as a test failure.

- **`apps/e2e/tests/repro.spec.ts`** is a new leftover debug spec: `console.log("FIELD VALUES", …)`, `console.log("SIGNUP STATUS", …)`, and a placeholder `test("third signup", …)` with no assertions — it duplicates `admin-users-page.spec.ts` tests almost verbatim. Not part of the spec's testing decisions and shouldn't ship.

- **Debug `console.log` left in `apps/api/src/apps/users/users.spec.ts`** (line 62, guarded by `eslint-disable-next-line no-console`), logging status/body on non-201 signup — debugging cruft.

- **Unrelated workflow-tooling changes bundled into this diff**: edits to `.claude/skills/gh-dev-workflow/{SKILL.md,phases/{grill,implement,review,spec,tickets}.md,plan-structure.md}` plus deletion of `docs/gh-dev-workflow-gaps.md` and `docs/gh-dev-workflow-merge-spec-and-ticket-drafting.md` and edits to `docs/gh-dev-workflow-model-effort-map.md`. None of this is called for anywhere in the Admin User Management spec.

Everything else checked (schema/migration ordering, ADMIN-lock 400s, grant/revoke 409/404s, pagination/search, role-in-use 409 payload with force-delete, nav hub linking, e2e coverage of the toggle/search/create/delete flows) matched the spec as written.

## Security

No exploitable vulnerabilities found. Specifically checked and confirmed sound:

- **Privilege escalation (ADMIN lock)**: `apps/api/src/apps/users/users.service.ts`'s `findAssignableRoleOrThrow()` rejects any grant/revoke where `role.name === "ADMIN"` with a 400, before the target-user/role lookup succeeds, regardless of whose account is targeted — including the calling admin's own. Enforced server-side in the service layer, not the UI. Covered by explicit tests (`users.spec.ts`: grant-to-self, grant-to-already-admin, revoke-from-self, revoke-from-already-admin all return 400/unchanged state).
- **Authorization**: every new endpoint in `roles.controller.ts` and `users.controller.ts` carries `@UseGuards(RolesGuard) @Roles("ADMIN")` — no unguarded state-changing route.
- **Injection**: all DB access goes through Drizzle-parameterized calls, including `ilike(users.name, ...)` in `users.repository.ts`. The migration (`0005_wooden_black_cat.sql`) contains only static SQL.
- **Input validation**: `GetUsersQueryDto` bounds `limit` (1-100) and `page`; UUID params use `IsUUID`/`ParseUUIDPipe`; global `ValidationPipe({whitelist: true, transform: true})` is active.
- **XSS**: frontend components render all user-controlled strings via JSX text interpolation (React auto-escapes) — no `dangerouslySetInnerHTML`.
- **Sensitive data exposure**: the role-in-use conflict response returning holder name/email is admin-only data about users the admin already manages — not a leak to an unprivileged party.
- **Dependencies**: no `package.json` changes in this diff.

Minor non-blocking observation (not a vulnerability, not gating this round): `apps/e2e/tests/helpers.ts`'s `grantRole()` builds a raw `psql -c` string via `execFileSync` with unescaped interpolation of `email`/`role` — test-harness code fed only by locally-generated fixture strings, not reachable by any external actor.

## Gate checklist

| Check | Result |
|---|---|
| Lint | N/A — no standalone lint script/config exists in this repo (checked root, `apps/api`, `apps/web` package.json + searched for eslint config). `next build` in `apps/web` runs its own built-in "Linting and checking validity of types" step and passed clean. |
| Build (`apps/api`: `npm run build`) | PASS |
| Build (`apps/web`: `npm run build`) | PASS |
| Unit/integration tests (`apps/api`: `npx jest`) | PASS — 13 suites, 185 tests, all green |
| E2E tests (`apps/e2e`: `npx playwright test`) | FAIL — 8 of 49 tests failed, reproduced identically on a full rerun (not flaky). See below. |

### E2E failures (genuine, reproducible on rerun)

1. **`admin-roles-page.spec.ts`** (3 tests) and **`admin-users-page.spec.ts`** (3 tests) all fail at `signUp`/`loginAsAdmin` with a timeout waiting for the "Log out" button. Root cause: `uniqueEmail(label)` in both files builds a local-part as `` `{admin-roles-page-e2e-|admin-users-page-e2e-}${label}-${randomUUID()}` ``, which exceeds the 64-character RFC 5321 local-part limit enforced by `class-validator`'s `@IsEmail()` for any test using an admin-named label — signup silently 400s and the subsequent "Log out" assertion times out. This is the same bug already flagged in this plan's `CONTEXT.md` gotchas (previously fixed only in `admin-navigation.spec.ts`'s short `e2e-` prefix) — it was never applied to these two newer spec files.
2. **`auth-flow.spec.ts:153`** — "a user granted ADMIN sees an ADMIN badge next to their name in the header" — fails with a Playwright strict-mode violation: `getByText("ADMIN")` now resolves to 2 elements, because this diff's new header "Admin" nav link (`<a href="/admin">Admin</a>`) collides with the existing role badge (`<span>ADMIN</span>`) under Playwright's default case-insensitive text matching. This is a real regression in a pre-existing test caused by the new nav link, not a flaky failure.
3. **`repro.spec.ts:48`** — "third signup" — fails via the same `signUp`/"Log out" timeout pattern as (1); this file is itself flagged above as scope creep to be deleted, which will resolve this failure as a side effect.

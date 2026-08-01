# Progress: Admin User Management

## Current phase
implement

## Current ticket path
plans/20260801_123544-admin-user-management/review/round-1/tickets/04-remove-unrelated-workflow-tooling-changes.md

## Phases
| Phase | Status | Date | Notes |
|---|---|---|---|
| grill | done | 2026-08-01 | |
| spec | done | 2026-08-01 | |
| tickets | done | 2026-08-01 | |
| implement/01-roles-schema-migration | done | 2026-08-01 | Re-implemented from scratch after user reverted the prior attempt from the working tree; see notes/implement-01-roles-schema-migration.md |
| implement/02-roles-api | done | 2026-08-01 | New `RolesModule` (list/create/delete), ADMIN-gated, built-in protection, block/force delete semantics; see notes/implement-02-roles-api.md |
| implement/03-users-api | done | 2026-08-01 | `UsersController`: paginated/searchable `GET /users` with inline roles, grant/revoke with ADMIN lock; see notes/implement-03-users-api.md |
| implement/04-admin-roles-page | done | 2026-08-01 | `/admin/roles` page: list/create/delete with confirm-then-force flow, reusable `AdminGate`; see notes/implement-04-admin-roles-page.md |
| implement/05-admin-users-page | done | 2026-08-01 | `/admin/users` page: debounced search, paging, role toggles, live pickup of newly-created roles; see notes/implement-05-admin-users-page.md |
| implement/06-admin-navigation | done | 2026-08-01 | Header "Admin" link, `/admin` hub page, back-navigation from both sub-pages, new e2e spec; found+fixed a real email-length bug in the new spec's test data, hit Docker Desktop instability partway through live verification — see notes/implement-06-admin-navigation.md |
| review/round-1 | FAIL | 2026-08-01 | Spec match: 2 real deviations (missing shared isAdmin() helper, built-in role delete returning 409 not 400) + 3 scope-creep items (debug repro.spec.ts + console.log in users.spec.ts + unrelated gh-dev-workflow edits). Security: pass. Build: pass. Unit/integration tests: pass. E2E tests: 8 failures (3 email-length bugs in admin specs, 1 header locator regression in auth-flow.spec.ts, + 3 in leftover repro.spec.ts). Six fix tickets written. See notes/review-round-1.md and review/round-1/findings.md. |
| implement/review-round-1-fix-01-shared-isadmin-helper | done | 2026-08-01 | Added `isAdmin(user)` to `apps/web/lib/api-client/auth.ts` alongside `canManageAwards`; `admin-gate.tsx` and `admin-nav-link.tsx` now both call it instead of duplicating the inline role check. `tsc --noEmit` and `next build` pass; full live e2e run deferred to after tickets 05/06 (unrelated known e2e bugs). See notes/implement-review-round-1-fix-01-shared-isadmin-helper.md. |
| implement/review-round-1-fix-02-role-delete-status-code | done | 2026-08-01 | `RolesService.remove()` now throws `BadRequestException` (400) instead of `ConflictException` (409) for built-in-role deletion; updated all three (not two) built-in-deletion tests in `roles.spec.ts` to expect 400; custom-role in-use 409 left unchanged. `tsc --noEmit` clean, full `apps/api` jest suite 185/185 pass. See notes/implement-review-round-1-fix-02-role-delete-status-code.md. |
| implement/review-round-1-fix-03-remove-scope-creep-test-artifacts | done | 2026-08-01 | Deleted leftover debug `apps/e2e/tests/repro.spec.ts`; removed debug `console.log` + its eslint-disable comment from `users.spec.ts`'s `signupUser` helper. No other references to `repro.spec.ts` anywhere. `tsc --noEmit` clean in both `apps/api` and `apps/e2e`; `users.spec.ts` full suite 29/29 pass. See notes/implement-review-round-1-fix-03-remove-scope-creep-test-artifacts.md. |

## Last session end-state
See notes/implement-review-round-1-fix-03-remove-scope-creep-test-artifacts.md. Ticket 03 (remove scope-creep test artifacts) done: deleted leftover debug `apps/e2e/tests/repro.spec.ts` (stray console.logs, assertion-less placeholder test, near-duplicate coverage of `admin-users-page.spec.ts`); removed the debug `console.log` and its `eslint-disable-next-line no-console` from `apps/api/src/apps/users/users.spec.ts`'s `signupUser` helper. Confirmed no other file references `repro.spec.ts` (grepped `apps/e2e/tests/helpers.ts` and the rest of the e2e test dir). `tsc --noEmit` clean in both `apps/api` and `apps/e2e`; `users.spec.ts` full suite (29/29) passes. Live e2e stack not run (not needed for a pure deletion; consistent with prior tickets' plan to do one full live e2e run once all round-1 fix tickets are done). Next: ticket 04-remove-unrelated-workflow-tooling-changes.md.

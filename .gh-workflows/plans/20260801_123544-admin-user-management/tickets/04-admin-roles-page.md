# 04 — Admin roles page (`/admin/roles`)

**What to build:** a UI page at `/admin/roles` (accessible only to logged-in ADMINs) that lists all roles, creates new custom roles, and deletes custom roles with a confirm-then-force-if-in-use confirmation flow.

**Blocked by:** 02 — Roles API

**Status:** done

- [x] /admin/roles route created in frontend app
- [x] /admin/roles renders nothing at all for anonymous visitors (no login prompt, no placeholder)
- [x] /admin/roles renders nothing at all for logged-in non-admin users
- [x] /admin/roles page renders list of all roles fetched from GET /roles
- [x] Roles list shows role name and built-in status indicator (visual distinction for built-in vs. custom)
- [x] Create form allows entering a role name and submitting via POST /roles
- [x] Create form handles 409 duplicate-name error, displays error message to user
- [x] Create form successfully creates role and updates the roles list immediately
- [x] Delete control (button or icon) appears only for custom (non-built-in) roles
- [x] Delete control is completely absent (not disabled, not hidden) for ADMIN and OPERATOR roles
- [x] Clicking delete on a custom role opens confirmation modal (reuses existing Dialog primitive)
- [x] Modal shows role name and requests confirmation
- [x] First confirm button calls DELETE /roles/:id without force flag
- [x] If API responds with 409 (in-use conflict), modal switches to show affected users list (name + email for each)
- [x] Modal then shows a force-delete button that retries DELETE /roles/:id with force=true flag
- [x] Successful delete (with or without force) invalidates both the roles list and the user list queries
- [x] Page refetches roles list after successful delete, removing the deleted role from view
- [x] /admin/roles page has a back link to /admin (not to home)

## Implementation notes / assumptions

- `apps/web/lib/api-client/schema.d.ts` and `apps/api/openapi.json` were stale (generated before tickets 02/03 added `RolesModule`/`UsersModule`) — regenerated both (`pnpm run generate:openapi` in `apps/api`, `pnpm run generate:api-types` in `apps/web`) so the frontend gets typed `/roles` and `/users` routes. Regenerating `apps/api`'s openapi.json first required deleting a stale `tsconfig.build.tsbuildinfo` — `nest build` was silently emitting nothing (empty `dist/`) because the incremental cache believed a from-before-ticket-01 build was still current; this is the exact class of bug called out in `coding-rules/node-typescript-docker.md`, just encountered locally rather than in Docker.
- `DELETE /roles/:id`'s 409-in-use body and `POST /roles`'s 409-duplicate body have no `@ApiConflictResponse` swagger decorator, so openapi-fetch infers their `error` field as `never`. Worked around in `apps/web/lib/api-client/roles.ts` by casting to `unknown` before inspecting the body — did not add swagger decorators to the backend since that's out of this ticket's scope (frontend-only) and ticket 02/03 already shipped without them.
- `isAdmin(user)` helper added to `apps/web/lib/api-client/auth.ts` alongside `canManageAwards`, same shape/pattern.
- `apps/web/lib/api-client/users.ts` created as a minimal placeholder exporting only `usersListQueryKeyPrefix` — needed so this ticket's role-deletion mutation can invalidate the (not-yet-built) admin users list cache. Ticket 05 should nest its real query key under this exact prefix (e.g. `[...usersListQueryKeyPrefix, page, search]`) so this invalidation keeps working.
- Found and fixed a real e2e-only bug (not a code bug) while writing the e2e spec: this sandbox's e2e Postgres volume was created before migration `0005_roles_table.sql` was finalized with `ON DELETE CASCADE` on `user_roles.role_id`, so force-delete was failing with a live FK-violation until the volume was dropped and recreated. The migration file on disk is correct; this was purely a stale persisted local Docker volume. Noted here in case a future session hits the same symptom against a similarly stale volume — fix is `docker compose ... down -v` for the e2e project before re-running.
- Also found and fixed a real e2e test bug (not a product bug): the spec's own `uniqueEmail()` helper originally prefixed every generated email with the long, fixed string `admin-roles-page-e2e-`, which combined with a longer role-name prefix like `operator` pushed the email's local part past RFC 5321's 64-character limit, causing the backend's `@IsEmail()` DTO validation to genuinely (and correctly) reject it with 400. Shortened the fixed prefix to `admin-roles-` to leave headroom.

## Test/build status

- `apps/web`: `tsc --noEmit` clean, `next build` (static export) clean.
- `apps/api`: `tsc --noEmit` clean, `jest` 163/163 passing (unchanged — this ticket touched no backend code).
- `apps/e2e`: `tsc --noEmit` clean. New `admin-roles-page.spec.ts` (9 tests) run live against the full dockerized stack (fresh e2e Postgres volume) — all 9 passing. Full e2e suite (`playwright test`, all spec files) also run live — 40/40 passing, no regressions.

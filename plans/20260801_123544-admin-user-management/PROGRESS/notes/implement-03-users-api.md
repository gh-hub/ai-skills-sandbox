# Implement: 03 — Users API

## What was built

New `UsersController` at `apps/api/src/apps/users/users.controller.ts`, plus `UsersService` (`users.service.ts`) and repository additions to the existing `UsersRepository` (`users.repository.ts`):

- `GET /users?page&limit&search` — ADMIN-gated, paginated (`page`/`limit`, default 10, max 100, via `GetUsersQueryDto`), searches by case-insensitive partial match on name or email (`ilike` + `or`, empty search = no filter). Returns the same `{items, total, page, limit, totalPages}` envelope as `GET /likes`. Each item includes `roles: {id, name}[]` (via `users-roles.util.ts`'s `groupRolesByUserId`, backed by a new `findRolesForUserIds` batch repository method — avoids N+1).
- `POST /users/:userId/roles` (`GrantRoleDto { roleId }`) — grants a role, 204 on success, 409 if already held, 404 if user or role doesn't exist, 400 if the role is `ADMIN`.
- `DELETE /users/:userId/roles/:roleId` — revokes a role, 204 on success, 404 if not held (or user/role doesn't exist), 400 if the role is `ADMIN`.
- New shared types added to `packages/shared-types/src/index.ts`: `UserRoleSummary`, `UserSummary`, `UsersPage`, `GrantUserRoleRequest` (package rebuilt after editing).
- New `apps/api/src/apps/users/users.spec.ts` integration test suite (testcontainers + supertest, mirroring `roles.spec.ts`/`awards.spec.ts`) covering every acceptance criterion, including the ADMIN lock against all four target shapes (plain user, OPERATOR-holding user, ADMIN-holding user, calling admin's own account).

No new migration was needed — ticket 01's schema already covers everything this ticket needed.

## Verification

- `npx tsc --noEmit` clean in `apps/api`.
- Full `apps/api` Jest suite: **185/185 passing** (13 suites), including the new `users.spec.ts` and `users.repository.spec.ts`.
- All 5 acceptance criteria in `tickets/03-users-api.md` marked `[x]`.

## Note on this session

The sub-agent that implemented this ticket finished the code and tests but stopped before completing the required plan write-up (PROGRESS/INDEX.md, this notes file, CONTEXT.md) — it ended on an unrelated "waiting for the monitor" message instead. The conductor session verified the implementation directly (typecheck + full test run + reading the controller/service/repository) before completing this write-up manually. The code itself was not touched — only the plan bookkeeping was finished after the fact.

## Gotchas for the next ticket (04 — /admin/roles page)

- Ticket 04 only depends on ticket 02 (Roles API), not this ticket — it can proceed independently of anything here.
- `apps/web/lib/api-client/schema.d.ts` and `apps/api/openapi.json` still do **not** reflect `/roles` or `/users` routes — `npm run generate:openapi` is broken outside Docker in this environment (pre-existing issue, not introduced by this ticket). Ticket 04's frontend API client work will need to hand-write request helpers (e.g. under `apps/web/lib/api-client/roles.ts`) against the documented route/DTO shapes rather than relying on generated types, the same way ticket 03 would have needed to for `/users` had it required a frontend piece.
- `Role` type (`{ id, name, isBuiltIn }`) and `RoleInUseError` (affected-users list for blocked deletes) are already in `packages/shared-types` from ticket 02 — reuse those for the frontend's TypeScript types rather than redefining them.

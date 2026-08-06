# Implement notes — 02 Roles API

## What was built

New `RolesModule` at `apps/api/src/apps/roles/`, following the `AwardsModule` structure exactly (`roles.module.ts` / `.controller.ts` / `.service.ts` / `.repository.ts` / `dto/`):

- `roles.repository.ts` (`RolesRepository`): `findAll`, `findById`, `findByName`, `insert(name)` (always `isBuiltIn: false`), `findUsersAssignedToRole(roleId)` (join `user_roles` → `users`, returns `{name, email}[]`), `deleteById`.
- `roles.service.ts` (`RolesService`):
  - `getAll()` — trivial pass-through.
  - `create(dto)` — look up by name first (mirrors `AuthService.signup`'s email-conflict pattern), `ConflictException` on collision (covers `ADMIN`/`OPERATOR` too, since they're just seeded rows), otherwise insert.
  - `remove(id, force)` — guard-clause chain: 404 if role doesn't exist, 400 if `isBuiltIn` (checked *before* the in-use check, so a built-in role always 400s regardless of `force`), then either force-delete directly or check `findUsersAssignedToRole` first and 409 with `{message, affectedUsers}` if any exist.
- `roles.controller.ts` (`RolesController`): `GET/POST /roles`, `DELETE /roles/:id?force=`. Each route individually carries `@UseGuards(RolesGuard) @Roles("ADMIN")` — **not** applied at the controller-class level, because `RolesGuard.canActivate` reads metadata via `this.reflector.get(ROLES_METADATA_KEY, context.getHandler())`, which only sees handler-level (method) metadata, not class-level. This matches `AwardsController`'s existing per-method pattern.
- `dto/`: `role.dto.ts` (`RoleDto implements Role`), `create-role.dto.ts` (`CreateRoleDto` — trims the name via `class-transformer`'s `@Transform` before `@IsNotEmpty`/`@IsString`), `delete-role-query.dto.ts` (`DeleteRoleQueryDto` — `force` query flag; note plain `@Type(() => Boolean)` would make `"false"` truthy since `Boolean("false") === true`, so it uses an explicit `@Transform(({value}) => value === true || value === "true")` instead), `role-in-use.dto.ts` (`RoleInUseDto`/`RoleAffectedUserDto` — swagger-only, for the 409 body shape).
- Registered `RolesModule` in `apps/api/src/app.module.ts`.
- `packages/shared-types/src/index.ts`: added `Role`, `CreateRoleRequest`, `RoleAffectedUser`, `RoleInUseResponse` — rebuilt `dist/` (`pnpm run build` in that package) so `apps/api`'s typecheck picks up the new exports immediately.
- `apps/api/src/apps/roles/roles.spec.ts` — new full-HTTP integration suite (real `INestApplication`, testcontainers Postgres, real migrations, supertest — same shape as `awards.spec.ts`), 20 tests covering: 401/403/200 on `GET /roles` (plus a role created via `POST` showing up in the list); 401/403/201/400(missing name)/409(duplicate custom, duplicate `ADMIN`, duplicate `OPERATOR`) on `POST /roles`; 401/403/404/400(`ADMIN`)/400(`OPERATOR`)/400(built-in even with `force=true`)/204(unused custom role)/409(in-use, asserts `affectedUsers` contains the expected `{name, email}`, and that the role row still exists afterward)/204+cascade(force-delete, asserts both the `roles` row and the `user_roles` row are gone) on `DELETE /roles/:id`.

## Key decisions / assumptions (also noted in the ticket file)

- Force-delete cascade relies on `user_roles.role_id`'s existing `ON DELETE CASCADE` FK (from ticket 01) rather than an explicit `db.transaction()` wrapper — a single `DELETE FROM roles WHERE id=...` is already one atomic statement, and wrapping it would be ceremony with no behavioral difference. Flagged in the ticket file in case a reviewer wants explicit transaction wrapping anyway.
- Role-name uniqueness is exact-string, case-sensitive (per spec's own stated assumption) — `admin` and `ADMIN` would be distinct rows. Names are trimmed before the uniqueness check/insert.
- `RolesModule` exports `RolesRepository` — ticket 03 (Users API, grant/revoke) will need to resolve a `roleId` to a role row and check `name === "ADMIN"` for the ADMIN lock (user story 28/29).

## Test/build status

- `pnpm exec tsc --noEmit` in `apps/api`: clean.
- `pnpm exec nest build` in `apps/api`: clean.
- `pnpm exec jest` in `apps/api`: **140/140 passing**, 11 suites (120 pre-existing + 20 new in `roles.spec.ts`), zero regressions.
- `npx tsc --noEmit` in `apps/e2e`: clean (shared-types addition is additive, no ripple).
- `apps/web` typecheck (`pnpm exec tsc --noEmit`) shows pre-existing errors referencing `.next/types/app/admin/**` (`Cannot find module '.../app/admin/page.js'`) — this is a **stale, gitignored `.next` build-cache artifact** from an earlier aborted attempt at the admin frontend (tickets 04–06 haven't created `app/admin/**/page.tsx` yet). Confirmed pre-existing and unrelated to this ticket's changes (`.next/` is in `.gitignore`, and `apps/web` has zero tracked changes). Not touched — will presumably resolve itself once ticket 04/06 actually creates those pages, or can be cleared with `rm -rf apps/web/.next` if it becomes a nuisance before then.

## Gotchas / things ticket 03 should know

- `RolesRepository` is exported from `RolesModule` and ready to `import`/inject into `UsersModule` (or wherever the grant/revoke service lives) for resolving `roleId` → role row (to check `isBuiltIn`/`name === "ADMIN"` for the lock, and to 404 on an unknown `roleId`).
- The `RoleDto`/`Role` shared type is `{id, name, isBuiltIn}` — ticket 03's `GET /users` response needs "each user's currently held roles (id + name)" per spec; you likely want a narrower shape (`{id, name}`, no `isBuiltIn`) for the per-user inline roles rather than reusing the full `Role` type verbatim — worth deciding at ticket 03 time rather than assuming reuse.
- The 409 "in use" body shape from `DELETE /roles/:id` is `{message: string, affectedUsers: {name, email}[]}` (see `RoleInUseResponse` in shared-types) — ticket 03 doesn't need this shape itself, but it's the established precedent if a similar "who's affected" response is ever needed there.
- `ConflictException`/`BadRequestException`/`NotFoundException` are thrown directly from services with either a string or (for the 409-in-use case) a structured object payload — no custom exception classes were introduced. Nest's default exception filter uses an object payload as the response body as-is (no injected `statusCode` field), which is why the test asserts `response.body.affectedUsers` directly.

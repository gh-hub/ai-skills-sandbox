# Implement notes: 01 — Roles data model

## What was built

- `apps/api/src/db/schema.ts`:
  - `roleEnum` — a Postgres `pgEnum("role", ["ADMIN", "OPERATOR"])`.
  - `userRoles` — new `pgTable("user_roles", ...)` with `id` (uuid PK, default random), `userId` (uuid, FK → `users.id`, `onDelete: "cascade"`, not null), `role` (roleEnum, not null), `createdAt` (timestamptz, default now, not null), and a unique constraint on `(userId, role)` via `unique().on(table.userId, table.role)`.
- Migration: `apps/api/drizzle/0004_hot_mister_fear.sql` — generated via `pnpm --filter @thanks-claude/api db:generate` (had to export a dummy `DATABASE_URL` env var for the config to load; `generate` itself doesn't touch a live DB). Contains only `CREATE TYPE "public"."role"`, `CREATE TABLE "user_roles"` (with the unique constraint inline), and the FK `ALTER TABLE ... ON DELETE cascade` — no seed data, no data migration, confirmed by reading the generated file.
- `apps/api/src/apps/users/users.repository.ts`: added `findRolesByUserId(userId: string): Promise<UserRole[]>` — queries `user_roles` filtered by `userId`, selecting just the `role` column, and returns a plain array of role strings (e.g. `["ADMIN", "OPERATOR"]`, or `[]` if the user has no roles). Also exported `export type UserRole = (typeof userRoles.$inferSelect)["role"]` from the same file for reuse. No new repository was created — `user_roles` is queried from `UsersRepository` directly, mirroring how `AwardsRepository` queries `like_awards` without a dedicated repository.

## For the next session (ticket 02 — JWT & shared-type roles claim)

- Call `usersRepository.findRolesByUserId(userId)` to get a user's roles as `string[]` (typed as `UserRole[]`, values `"ADMIN" | "OPERATOR"`) when building the JWT payload at login. This is the method ticket 02 needs.
- `UsersRepository` is already exported from `UsersModule` (`apps/api/src/apps/users/users.module.ts`) — no module wiring changes needed to consume it elsewhere (e.g. from the auth module), just import `UsersModule` if not already imported there.
- The `role` enum values are `"ADMIN"` and `"OPERATOR"` (exact casing) — use these literals for the JWT `roles: string[]` claim and any `AuthUser`/`SessionTokenPayload` shared types.
- Every user starts with zero roles (no seed data was added) — ticket 02's "stale JWT / no roles claim → treat as `roles: []`" decision aligns with this: a freshly migrated/created user's `findRolesByUserId` call returns `[]`.

## Tests added

- `apps/api/src/apps/users/users.repository.spec.ts`: unit tests for `findRolesByUserId` using the existing chain-mock `DbClient` pattern (mirrors `findByEmail`/`findById` tests) — asserts `select({role: ...}).from(userRoles).where(...)` is issued and that role strings (not full rows) are returned, plus an empty-array case.
- `apps/api/src/db/schema.spec.ts`: extended the existing testcontainers-based schema/migration test (previously only covering `like_awards` cascades) with three new cases: a fresh user has zero roles by default, `user_roles` rows cascade-delete when the referenced user is deleted, and a duplicate `(user_id, role)` insert is rejected by the unique constraint.

## Verification run

- `tsc --noEmit` on `apps/api`: clean.
- Full API suite (`pnpm --filter @thanks-claude/api test`, uses testcontainers/Docker): 10 suites, 107 tests, all passing.

## Gotchas / ambiguities

- None encountered that required deviating from the ticket. One judgment call: the ticket didn't specify a migration-generation env setup; `drizzle.config.ts` throws if `DATABASE_URL` is unset even though `generate` doesn't need a live DB connection, so a dummy `DATABASE_URL` was exported for that one command only (not persisted anywhere, not needed for tests — the test suite sets its own testcontainers `DATABASE_URL`).

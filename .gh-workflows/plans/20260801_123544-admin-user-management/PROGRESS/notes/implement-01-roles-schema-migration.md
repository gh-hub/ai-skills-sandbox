# Implement notes — 01 Roles schema migration

## What was built

- `apps/api/src/db/schema.ts`: added a `roles` table (`id` uuid PK default random, `name` text unique not null, `is_built_in` boolean not null). Replaced `userRoles.role` (the `role` pg enum column) with `userRoles.roleId` (uuid, FK → `roles.id`, `onDelete: "cascade"` — matching the existing `user_roles.user_id`/`like_awards` FK convention per spec). Unique constraint moved from `(user_id, role)` to `(user_id, role_id)`. Removed the `roleEnum` export entirely (no longer needed).
- `apps/api/drizzle/0005_roles_table.sql` (+ `meta/0005_snapshot.json` + `meta/_journal.json` entry): hand-written migration, ordered seed → backfill → drop, per spec:
  1. `CREATE TABLE roles`
  2. `INSERT INTO roles` seeding `ADMIN`/`OPERATOR` with `is_built_in = true`
  3. `ALTER TABLE user_roles ADD COLUMN role_id uuid` (nullable)
  4. `UPDATE user_roles SET role_id = roles.id ... WHERE roles.name = user_roles.role::text` (the backfill)
  5. `ALTER TABLE user_roles ALTER COLUMN role_id SET NOT NULL`
  6. Add the `role_id` FK (cascade)
  7. Drop the old `(user_id, role)` unique constraint, add the new `(user_id, role_id)` one
  8. `ALTER TABLE user_roles DROP COLUMN role`
  9. `DROP TYPE role`
- Written by hand rather than via `drizzle-kit generate` — the CLI's interactive rename-vs-new-column prompt requires a TTY and errors out non-interactively in this environment. Verified correctness instead by running the real `drizzle-orm/node-postgres/migrator` (confirmed from source: it only reads `meta/_journal.json` + the `.sql` files at runtime, never the snapshot JSON — so the hand-written snapshot only matters for a future `drizzle-kit generate` diff, not for correctness now) against fresh and pre-existing-data testcontainers Postgres instances.
- `apps/api/src/apps/users/users.repository.ts`: `findRolesByUserId` rewritten to `select({name: roles.name}).from(userRoles).innerJoin(roles, eq(userRoles.roleId, roles.id)).where(...)`, still returns `string[]` (role names). `UserRole` type now derived from `roles.$inferSelect["name"]` instead of the old enum.
- `apps/api/src/apps/users/users.repository.spec.ts`: updated the mocked-chain test for `findRolesByUserId` to assert the new `innerJoin` call and `{name: ...}` select shape.
- Test-helper ripple (all direct writes against the soon-to-be-dropped `role` column, updated to resolve a role name to `roles.id` first):
  - `apps/api/src/apps/awards/awards.spec.ts`'s `grantRole` helper (ticket-named).
  - `apps/e2e/tests/helpers.ts`'s `grantRole` helper — raw `psql` INSERT now joins `users`/`roles` by name (ticket-named).
  - `apps/api/src/apps/likes/likes.spec.ts` (**not** named in the ticket, found by grep — had its own inline `db.insert(userRoles).values({..., role: "ADMIN"})` in the awards-attachment test).
  - `apps/api/src/db/schema.spec.ts` (**not** named in the ticket — three direct `role:` inserts plus a `(user_id, role)` duplicate test, all switched to resolve `roles.id` first).
- New/expanded tests in `apps/api/src/db/schema.spec.ts`:
  - `"seeds ADMIN and OPERATOR as built-in roles on a fresh database"` — schema/seed check.
  - `"cascades user_roles cleanup when the referenced role is deleted"` — proves the `onDelete: "cascade"` FK design decision (relevant for ticket 02's force-delete).
  - `"backfills a pre-existing enum-based user_roles row to the matching seeded role_id"` — the real backfill proof: builds a temp migrations folder containing every migration except `0005_roles_table.sql`, migrates a fresh DB to the pre-0005 (enum-column) state, raw-SQL-inserts an old-shape row, then applies `0005` and asserts it resolved to the right `roles.id`. Without this, none of the other tests (which apply all 6 migrations to an always-empty DB) would ever actually exercise the `UPDATE` backfill statement against non-empty data.

## Test/build status

- `pnpm exec tsc --noEmit` in `apps/api`: clean.
- `pnpm exec nest build` in `apps/api`: clean.
- `pnpm exec jest` in `apps/api`: **120/120 passing**, all 10 suites, including the full-HTTP integration suites (`auth.spec.ts`, `awards.spec.ts`, `likes.spec.ts`) confirming zero regression in `RolesGuard`/JWT/`AwardsController`.
- `npx tsc --noEmit` in `apps/e2e`: clean (helpers.ts change typechecks).
- e2e Playwright specs themselves were not run (require the full dockerized stack per e2e's own setup, out of scope for this ticket's verification — the helper's typecheck plus the schema-level backfill test are the relevant proof points at this layer).

## Gotchas / things ticket 02 should know

- `roles.id`'s FK from `user_roles.role_id` is `ON DELETE CASCADE`. This means ticket 02's force-delete (`DELETE /roles/:id?force=true`) can likely just `DELETE FROM roles WHERE id = ...` inside a transaction and let Postgres cascade-delete the `user_roles` rows itself, rather than needing a manual two-step delete — worth confirming against the ticket's own acceptance criteria when you get there.
- `apps/api/src/apps/roles/dto/` and `apps/api/src/apps/users/dto/` already exist as **empty** directories in the working tree (untracked). They look like leftover scaffolding from an earlier aborted attempt, predating this session. Ticket 01 didn't need them and left them untouched — ticket 02 (RolesModule) and ticket 03 (UsersModule controller) will presumably populate them; just be aware they're not new artifacts from this ticket.
- The hand-written `0005_roles_table.sql` + its snapshot/journal entries are not `drizzle-kit generate` output. If a later ticket runs `drizzle-kit generate` for a new migration, double check it diffs cleanly against `0005`'s hand-written snapshot (`apps/api/drizzle/meta/0005_snapshot.json`) — it was built to accurately reflect `schema.ts`'s post-migration shape, but wasn't machine-verified via the generator itself (only via the runtime migrator, which ignores snapshots).
- `UserRole` type export on `UsersRepository` was unused before this change and remains unused after — not introduced by this ticket, just noting it's still there for whoever eventually reaches for it.

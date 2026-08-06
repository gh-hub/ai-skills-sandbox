# 01 — Roles schema migration

**What to build:** a new `roles` table as the source of truth for role names (instead of the Postgres enum), a backfill migration moving all existing user role assignments from enum values to FK references, and updates to the code and test helpers that read/write roles directly.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] New `roles` table created with id (uuid PK, default random), name (text, unique), is_built_in (boolean, not null)
- [x] Migration seeds ADMIN and OPERATOR roles with is_built_in = true
- [x] user_roles.role (enum column) is replaced with user_roles.role_id (uuid, FK → roles.id, not null)
- [x] Unique constraint on user_roles moves from (user_id, role) to (user_id, role_id)
- [x] All existing user_roles rows are backfilled to point role_id at the seeded ADMIN or OPERATOR row matching their old enum value
- [x] Old user_roles.role enum column is dropped after backfill completes
- [x] Old Postgres role enum type is dropped once nothing references it
- [x] findRolesByUserId in UsersRepository is rewritten to join user_roles → roles and return role names, preserving its string[] return contract
- [x] findRolesByUserId query change is unit tested (mocked-db-chain style at users.repository.spec.ts level)
- [x] awards.spec.ts's grantRole test helper is updated to resolve a role name to its roles.id before inserting
- [x] e2e helpers.ts's grantRole helper is updated to resolve a role name to its roles.id in the INSERT statement before inserting
- [x] SessionTokenPayload.roles, AuthUser.roles, and MeResponse.roles remain roles: string[] with zero code changes
- [x] RolesGuard and @Roles(...) decorator continue to work unchanged on existing code (including AwardsController)
- [x] Migration runs without errors on a fresh database and correctly seeds ADMIN/OPERATOR
- [x] Migration correctly backfills existing user_roles rows before dropping the old column

## Implementation notes

- Wrote the migration (`apps/api/drizzle/0005_roles_table.sql`) and its `meta/0005_snapshot.json` + `_journal.json` entry by hand rather than via `drizzle-kit generate`, because the CLI's interactive column-rename-conflict prompt (`role` → `role_id`) requires a TTY and can't run non-interactively in this environment. Verified correctness by running the real migrator (`drizzle-orm/node-postgres/migrator`) against fresh and pre-existing-data testcontainers Postgres instances — the runtime migrator only reads `meta/_journal.json` + the `.sql` files (confirmed from its source), so the hand-written snapshot JSON has no effect on runtime behavior, only on future `drizzle-kit generate` diffing.
- `user_roles.role_id`'s FK uses `onDelete: "cascade"`, matching the spec's explicit note to follow the existing `user_roles.user_id`/`like_awards` FK convention. This also means a role's `DELETE ... force=true` cascade (ticket 02) can rely on the DB's own cascade rather than manually deleting `user_roles` rows in application code.
- Found and fixed two more direct enum-column writes beyond the ticket's named `awards.spec.ts`/e2e `helpers.ts` cases: `apps/api/src/apps/likes/likes.spec.ts` (`db.insert(userRoles).values({..., role: "ADMIN"})`) and `apps/api/src/db/schema.spec.ts` (three separate `role:` inserts plus role-focused assertions). Both now resolve a role name to `roles.id` first, same pattern as the ticket-named fixes.
- Added a real integration test proving the backfill step, not just schema shape: `apps/api/src/db/schema.spec.ts`'s new `"backfills a pre-existing enum-based user_roles row to the matching seeded role_id"` test builds a temporary migrations folder containing every migration except `0005_roles_table.sql`, migrates a fresh testcontainers DB to that pre-migration state, raw-SQL-inserts an old-shape `user_roles` row, then applies `0005` and asserts the row now resolves to the correct role by name. Without this, the fresh-DB-only tests would never actually exercise the backfill `UPDATE` against non-empty data.
- Also added a schema-level seed test (`"seeds ADMIN and OPERATOR as built-in roles..."`) and a `roles`-deletion-cascades-`user_roles` test, both in `schema.spec.ts`, validating the new table/FK behavior at the same level as the file's existing cascade tests.
- Left two pre-existing empty scaffold directories untouched: `apps/api/src/apps/roles/dto` and `apps/api/src/apps/users/dto` (both untracked, empty, presumably leftover from a prior aborted attempt at a later ticket) — out of scope for this ticket, ticket 02/03 will populate them.

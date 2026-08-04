# 01 — Roles schema migration

**What to build:** a new `roles` table as the source of truth for role names (instead of the Postgres enum), a backfill migration moving all existing user role assignments from enum values to FK references, and updates to the code and test helpers that read/write roles directly.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] New `roles` table created with id (uuid PK, default random), name (text, unique), is_built_in (boolean, not null)
- [ ] Migration seeds ADMIN and OPERATOR roles with is_built_in = true
- [ ] user_roles.role (enum column) is replaced with user_roles.role_id (uuid, FK → roles.id, not null)
- [ ] Unique constraint on user_roles moves from (user_id, role) to (user_id, role_id)
- [ ] All existing user_roles rows are backfilled to point role_id at the seeded ADMIN or OPERATOR row matching their old enum value
- [ ] Old user_roles.role enum column is dropped after backfill completes
- [ ] Old Postgres role enum type is dropped once nothing references it
- [ ] findRolesByUserId in UsersRepository is rewritten to join user_roles → roles and return role names, preserving its string[] return contract
- [ ] findRolesByUserId query change is unit tested (mocked-db-chain style at users.repository.spec.ts level)
- [ ] awards.spec.ts's grantRole test helper is updated to resolve a role name to its roles.id before inserting
- [ ] e2e helpers.ts's grantRole helper is updated to resolve a role name to its roles.id in the INSERT statement before inserting
- [ ] SessionTokenPayload.roles, AuthUser.roles, and MeResponse.roles remain roles: string[] with zero code changes
- [ ] RolesGuard and @Roles(...) decorator continue to work unchanged on existing code (including AwardsController)
- [ ] Migration runs without errors on a fresh database and correctly seeds ADMIN/OPERATOR
- [ ] Migration correctly backfills existing user_roles rows before dropping the old column

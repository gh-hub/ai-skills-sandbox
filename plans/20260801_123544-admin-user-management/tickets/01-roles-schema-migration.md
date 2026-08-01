# 01 — Roles schema migration & role-lookup prefactor

**What to build:** The set of roles becomes real, admin-extensible data instead of a fixed database type. A new `roles` table is introduced, holding an id, a unique name, and a flag marking whether a role is one of the two built-in roles the app has always shipped with. That table is seeded with the `ADMIN` and `OPERATOR` roles, both marked built-in. Every user's existing role assignment is carried forward automatically so nobody's access changes as a result of this work, and the old fixed role type is retired once nothing depends on it anymore. Everything above the data layer — how a user's roles show up in their session, how routes decide who's allowed in, how the "me" endpoint reports roles — keeps behaving exactly as it does today; this ticket is invisible from the outside. The handful of test helpers that currently poke the old role storage directly are updated to work the new way, so the existing test suites keep passing.

**Blocked by:** None — can start immediately

**Status:** done (2026-08-01)

- [x] The `roles` table exists with a unique id per role, a unique name per role, and a not-null flag marking built-in status
- [x] The migration seeds exactly `ADMIN` and `OPERATOR` into the `roles` table with the built-in flag set to true
- [x] Every user's existing role assignment is backfilled to point at the correct seeded role matching its prior value, with no assignment left unresolved or pointing at nothing
- [x] The migration performs seeding, then backfilling, then removal of the old role storage, in that order
- [x] The old fixed role type is fully removed once no assignment references it anymore
- [x] The user-role lookup used throughout the app (feeding sessions, the "me" endpoint, and route guards) returns the exact same shape — a plain list of role names — as it did before this migration, for every existing user
- [x] Route gating by role, session contents, and the "me" endpoint's reported roles require zero code changes as a result of this migration
- [x] The existing test suites covering awards and authentication continue to pass with no behavioral changes, only updates to how they set up test data
- [x] The unit test covering the user-role lookup is updated to match its new underlying query shape and continues to pass
- [x] The test helpers that currently create role assignments by writing the old role value directly are updated to resolve a role name to its real role record first, and every existing test relying on those helpers continues to pass

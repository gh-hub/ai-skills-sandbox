# 01 — Roles data model

**What to build:** The database schema that lets a user hold zero, one, or both of two roles, plus a way to look up a given user's roles. No API or UI surface changes yet — this ticket only makes the schema exist and queryable.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] A new Postgres enum type `role` is added via drizzle's `pgEnum`, with exactly two values: `ADMIN` and `OPERATOR`.
- [ ] A new `user_roles` table is added with columns: `id` (uuid primary key, default random), `user_id` (uuid, foreign key to `users.id`, not null), and `role` (the new enum, not null).
- [ ] `user_roles.user_id` cascade-deletes when the referenced user row is deleted (`onDelete: "cascade"`), matching the convention already used by `like_awards`'s foreign keys.
- [ ] `user_roles` has a unique constraint on the combination of `(user_id, role)`, so a user can hold more than one role but never two rows for the same role.
- [ ] `user_roles` includes a `created_at` column (`timestamp with time zone`, default `now()`, not null), consistent with every other table in the schema.
- [ ] A new drizzle migration (the next one after `0003_nice_sir_ram.sql`) is generated via the project's normal `drizzle-kit generate` flow, and adds only the enum type and the table plus its foreign key and unique constraints — no seed data and no data migration. Every existing and new user starts with zero roles by default.
- [ ] No changes are made to the `users`, `awards`, `likes`, or `like_awards` tables.
- [ ] A new method is added for looking up a user's roles (a list of role strings) by `user_id`, querying `user_roles`. This lives on `UsersRepository` rather than a new dedicated repository, following the existing convention where `like_awards` is queried directly by `AwardsRepository` rather than given its own repository — `user_roles` is treated the same way, as a property of a user.

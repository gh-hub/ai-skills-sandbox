# Glossary: Admin User Management

**roles table** — New Postgres table (`id` uuid PK, `name` text unique, `is_built_in` boolean not null) replacing the hardcoded `role` Postgres enum as the source of truth for what roles exist. Seeded with `ADMIN` and `OPERATOR` rows.

**`is_built_in`** — Boolean column on the `roles` table. `true` for `ADMIN` and `OPERATOR` (seeded, permanent, undeletable). `false` for any admin-created custom role (deletable).

**built-in role** — A role with `is_built_in = true`: currently `ADMIN` and `OPERATOR`. Cannot be deleted via `/admin/roles` or its API. `ADMIN` additionally cannot be granted or revoked via this feature at all (see "ADMIN lock").

**custom role** — A role with `is_built_in = false`, created by an ADMIN through `/admin/roles`. A pure label: assignable to users like any other role, but carries no route/permission enforcement of its own. Deletable (with force-flag semantics if in use).

**ADMIN lock** — The rule that the `ADMIN` role can never be granted or revoked through this feature's UI or API, for any user, including an admin acting on their own row. Enforced server-side. Promoting a user to `ADMIN` remains a direct-database-only operation.

**`/admin` hub** — The top-level admin page (`/admin`), ADMIN-gated, containing links to `/admin/users` and `/admin/roles`. Back link goes to home (`/`). Both admin sub-pages link back to this hub rather than directly to home, and the header's admin nav link points here rather than at a sub-page.

**force-delete (`force=true`)** — Query flag on `DELETE /roles/:id`. Without it, deleting a role that's currently assigned to users fails and returns the affected users (name + email). With it, the role is deleted and removed from every user who had it, in one step.

**`user_roles`** — Existing join table (from the prior roles/permissions plan) linking users to roles. Its `role` enum column is replaced by a `role_id` uuid FK to the new `roles` table; its unique constraint moves from `(user_id, role)` to `(user_id, role_id)`.

**`RolesGuard` / `@Roles(...)`** — Existing route-level guard and decorator (`apps/api/src/apps/auth/roles.guard.ts`, `roles.decorator.ts`) that gates routes by intersecting `request.user.roles` (an array of role name strings) with the roles required by `@Roles(...)`. Unaffected by the schema migration in this plan — it keeps matching by name string.

**`AuthUser` / `MeResponse` / `SessionTokenPayload`** — Existing types carrying `roles: string[]` (role names, not ids). This shape is preserved unchanged by this feature; only the backing storage of `user_roles` changes.

**paginated/searchable `GET /users`** — The first list endpoint in this codebase to support pagination and search, as opposed to the simple full-list convention used elsewhere (e.g. `GET /awards`). Search matches user name or email, case-insensitive, partial match. Exact response shape and default page size are left to spec/tickets.

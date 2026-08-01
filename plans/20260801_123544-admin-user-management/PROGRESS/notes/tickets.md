# Session end-state: tickets

The ticket breakdown was approved live with the user and written up as 3 tickets:

1. **01 — Roles schema migration & role-lookup prefactor** (blocked by: none). Introduces the `roles` table seeded with `ADMIN`/`OPERATOR`, migrates `user_roles` from an enum column to a `role_id` FK with backfill, rewrites `UsersRepository.findRolesByUserId` to preserve its `string[]` contract, and updates the test helpers (`awards.spec.ts`, e2e `helpers.ts`) that write role assignments directly. Pure prefactor — no user-facing behavior change.
2. **02 — Role & user management (API + /admin/roles + /admin/users)** (blocked by: 01). Full vertical slice: `RolesModule` (list/create/delete roles, with built-in protection and in-use force-delete), `UsersModule` controller (paginated/searchable user list with inline roles, grant/revoke endpoints enforcing the ADMIN lock), and the `/admin/roles` and `/admin/users` frontend pages. Includes full HTTP integration tests and new Playwright e2e specs.
3. **03 — Admin navigation** (blocked by: 02). Header "Admin" link gated by a shared `isAdmin(user)` helper, new `/admin` hub page linking to both sub-pages and home, sub-pages linking back to the hub, with e2e coverage for link visibility and navigation flow.

Ticket files live at `plans/20260801_123544-admin-user-management/tickets/01-roles-schema-migration.md`, `02-role-and-user-management.md`, `03-admin-navigation.md`.

**Next:** ticket 01 (roles schema migration & role-lookup prefactor) is up for implementation.

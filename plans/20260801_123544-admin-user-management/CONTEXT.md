# Context: Admin User Management

## What we're building
An admin-only user/role management UI and API: an `/admin` hub with `/admin/users` (paginated, searchable user list with role grant/revoke) and `/admin/roles` (list/create/delete roles), gated to ADMIN only.

## Key decisions
- ADMIN-only access to all new surfaces, following the existing `RolesGuard` + `@Roles(...)` pattern; `POST /auth/signup` verified unaffected. See `grill/decisions.md`.
- `role` enum replaced by a real `roles` table with FK-based `user_roles.role_id` and a backfill migration; JWT/`AuthUser`/`RolesGuard` contracts unchanged. See `grill/ADR-001.md`.
- The `ADMIN` role can never be granted or revoked through this feature, for anyone, including an admin's own row — enforced server-side. See `grill/decisions.md`.
- Custom roles are pure labels with no enforcement wiring; only custom (non-built-in) roles are deletable, with block-by-default + force-flag deletion semantics. See `grill/decisions.md`.
- `GET /users` is paginated and searchable from the start, a deliberate deviation from this codebase's simple-list convention; response shape and default page size deferred to spec/tickets. See `grill/ADR-002.md`.

## Spec
Full spec synthesized from the grill output: `spec.md`. Resolves the deferred route shapes (new `RolesModule` for list/create/delete roles; `UsersModule` gains a controller for `GET /users` and grant/revoke sub-routes), the `GET /users` pagination envelope (reuses the existing `GET /likes` `{items, total, page, limit, totalPages}` shape and page-size-10/max-100 convention), and the full status-code matrix for grant/revoke/create/delete including the ADMIN lock. See `PROGRESS/notes/spec.md` for the session write-up and flagged open questions.

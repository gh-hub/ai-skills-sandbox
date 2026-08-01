# Session end-state: grill

## What was gathered

Ran a grill interview (one question at a time, all confirmed by the user) covering:

1. Roles data model — Postgres `pgEnum` (`ADMIN`/`OPERATOR`) + a single `user_roles` join table with a unique `(user_id, role)` constraint; rejected a two-table `roles`/`user_roles` design and a `text` + `CHECK` alternative.
2. JWT payload — `SessionTokenPayload` and the shared `AuthUser` type gain `roles: string[]`.
3. Stale sessions — missing `roles` claim treated as `[]`, no forced logout.
4. Backend guard — new `@Roles(...)` decorator + `RolesGuard`, route-level (matching `RequireAuthGuard`'s style, not a global guard); 401 if logged out, 403 if missing role. Applied to `POST /awards`, and newly to `PATCH /awards/:id` and `DELETE /awards/:id` (currently unguarded — closes that gap).
5. Role assignment — explicitly out of scope; database-only, no UI/endpoint.
6. Award edit/delete UI — stays on the existing `/awards` page; edit/delete icons per row; delete has a confirm modal; edit has a pre-filled modal plus an extra "are you sure?" step beyond the normal submit.
7. Frontend gating — create-award section and new edit/delete icons gated on logged-in + `ADMIN`/`OPERATOR`; fully hidden (not disabled) for everyone else.
8. Back button — added above the `<h1>Awards</h1>` heading on `apps/web/app/awards/page.tsx`, linking to `/`.
9. Role display — small badges/pills next to the user's name/avatar in `header-auth-control.tsx`; nothing shown if no roles.

Full detail is in `grill/requirements.md`, `grill/decisions.md` (one entry per numbered decision above), `grill/glossary.md`, and `grill/ADR-001.md` (architectural record for the data model, JWT claim, and guard pattern — decisions 1, 2, 4).

## What's next

Move to the **spec** phase: turn these decisions into a concrete technical spec (schema/migration details, exact file-by-file backend and frontend changes, API contracts) at `spec.md`, ready to be broken into tickets.

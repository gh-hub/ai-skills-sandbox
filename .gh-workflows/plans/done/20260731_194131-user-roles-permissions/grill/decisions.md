# Decisions: User Roles & Permissions

## Decision: Roles table design
Decided: Introduce a real Postgres enum type via drizzle's `pgEnum` with values `ADMIN` and `OPERATOR`. Add a new `user_roles` join table with `user_id` (FK → `users.id`) and `role` (the enum), with a unique constraint on `(user_id, role)`.
Why: A user can have more than one role, but the same role can't be attached to a user twice — the unique constraint on the pair enforces that directly in the schema rather than in application code.
Alternatives rejected: A two-table `roles` + `user_roles` design (mirroring the `awards`/`like_awards` pattern) — rejected as over-engineering since the role set is fixed and small, not user-manageable data. A plain `text` column with a `CHECK` constraint instead of a real Postgres enum — rejected in favor of a real enum type.

## Decision: JWT payload carries roles
Decided: `SessionTokenPayload` gains a `roles: string[]` claim (the enum string values, e.g. `["ADMIN", "OPERATOR"]`). `buildSession()` in `auth.service.ts` looks up the user's roles and includes them; `verifySessionToken()` passes roles through; the shared `AuthUser` type in `packages/shared-types/src/index.ts` (and therefore `MeResponse` / `GET /auth/me`) carries `roles: string[]`.
Why: Roles need to be available to both backend guards and the frontend without an extra database round trip on every request — putting them in the session token makes them available anywhere the session is already verified.
Alternatives rejected: none discussed — putting roles in the JWT was the natural extension of the existing session-token pattern.

## Decision: Stale session handling
Decided: A JWT issued before this change (no `roles` claim) is treated as `roles: []`, not an error. No forced logout or session invalidation happens on deploy.
Why: Sessions already expire on their own (7-day expiry), so forcing everyone to re-login is unnecessary churn; treating a missing claim as "no roles" is a safe default since it fails closed (no privileges) rather than open.
Alternatives rejected: Forcibly invalidating all existing sessions on deploy — rejected as unnecessary given the short natural expiry and the safe default of empty roles.

## Decision: Backend guard shape
Decided: Add a new `@Roles(...)` decorator and a `RolesGuard`, following the existing route-level `@UseGuards(...)` style used by `RequireAuthGuard` (not a global `APP_GUARD`). It composes with authentication rather than replacing it: no `request.user` at all → `401 Unauthorized`; logged in but missing the required role → `403 Forbidden`. Applied to `POST /awards` (replacing the bare `RequireAuthGuard`), and newly applied to `PATCH /awards/:id` and `DELETE /awards/:id`, all requiring `ADMIN` or `OPERATOR`. `GET /awards` and `GET /awards/:id` stay unguarded.
Why: This repo has no `RolesGuard` precedent, so the new guard should match the existing route-level guard convention rather than introduce a new global-guard pattern. Keeping the 401-vs-403 distinction matches normal REST semantics (auth failure vs. authorization failure) and keeps the guard useful as a template for future role-gated routes.
Alternatives rejected: none discussed — a global `APP_GUARD`-based roles guard was not considered, since the codebase's only precedent (`RequireAuthGuard`) is route-level.

## Decision: Role assignment is out of scope
Decided: No role-management UI and no endpoint to assign or revoke roles in this feature. Roles are managed by directly inserting/deleting rows in the `user_roles` table via the database. New signups get no roles by default.
Why: Keeps this feature scoped to "roles exist and are enforced," deferring the (separately significant) question of who gets to grant roles and how, to a later feature if needed.
Alternatives rejected: none discussed — this was accepted as scope as proposed.

## Decision: Award edit/delete UI stays on the existing /awards page
Decided: No new route. Each award row in `awards-list.tsx` gets an edit icon and a delete icon. New API hooks (`useUpdateAward()`, `useDeleteAward()`) are added to `apps/web/lib/api-client/awards.ts`, hitting the existing `PATCH`/`DELETE` backend routes.
Why: The existing awards page already renders the list and create form together; adding icons/modals to the same page avoids introducing new navigation for what's fundamentally the same object.
Alternatives rejected: A separate award detail/edit route — not pursued; not discussed as a real alternative given the single-page pattern already in place.

## Decision: Delete confirmation and double-confirm edit
Decided: The delete icon opens a confirm modal ("are you sure?"); confirming calls delete. The edit icon opens a modal pre-filled with the award's current title/description/icon (reusing the create form's fields/shape); submitting ("save") shows a second "are you sure?" confirmation step before the update is actually persisted.
Why: Deliberate, explicit ask for extra friction on destructive/mutating actions — particularly a belt-and-suspenders confirmation on edit, beyond the normal form submit, to prevent accidental changes.
Alternatives rejected: A single-step edit save (submit-and-done, matching the create form) — explicitly rejected in favor of the extra confirmation step.

## Decision: Frontend gating condition
Decided: The create-award section and the new edit/delete icons are gated on "logged in AND has ADMIN or OPERATOR role" (checked against the new `roles` field on `useMe()`'s data). Non-privileged and logged-out users see these elements fully hidden, not disabled/greyed-out.
Why: Matches the existing pattern for logged-out users (the create form is already fully hidden rather than disabled today) and avoids exposing UI affordances for actions a user isn't allowed to take.
Alternatives rejected: Disabling (greying out) the controls for non-privileged users instead of hiding them — rejected in favor of consistency with existing logged-out behavior.

## Decision: Back button on the awards page
Decided: Add a "← Back" button/link at the top of `apps/web/app/awards/page.tsx`, above the `<h1>Awards</h1>` heading, linking to `/` (home).
Why: The awards page currently has no way back to the home page except the global header's "Awards" link (which doesn't help going the other direction) — a direct back link improves navigation.
Alternatives rejected: none discussed.

## Decision: Displaying a user's roles in the header
Decided: In `apps/web/components/header-auth-control.tsx`, next to the user's avatar/name, show the logged-in user's roles as small badges/pills, one per role. A user with no roles shows nothing extra (just the avatar, as today).
Why: Makes a user's privilege level visible at a glance, which is useful given that privileged UI (create/edit/delete) is otherwise silently hidden or shown with no other visual cue.
Alternatives rejected: none discussed.

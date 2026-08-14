# Requirements: Admin User Management

## Problem

Admins currently have no way to see all users in the system or manage their roles through any UI or API. Role assignment is a direct-database-only operation today. This feature gives ADMINs a self-service UI and API for viewing users and managing (most) role assignments, and for managing the set of roles that exist at all.

## Solution

### Who can use this

Only users with the `ADMIN` role can access any part of this feature — listing users, viewing/managing their roles, listing/creating/deleting roles. Logged-in users without `ADMIN` (including `OPERATOR`) get the same 401 (not logged in) / 403 (logged in, wrong role) treatment as any other role-gated route in this codebase. Anonymous users are unaffected: `POST /auth/signup` stays fully open, no guard added — this was verified against current code, not changed.

### What an ADMIN can do

- View a paginated, searchable list of all users (search matches name or email, case-insensitive, partial match).
- See each user's current roles.
- Grant or revoke a role on any user, via toggle/checkbox — except the `ADMIN` role, which cannot be granted or revoked through this feature for anyone, under any circumstances (see Decisions).
- View a list of all roles (built-in and custom).
- Create a new custom role (name only).
- Delete a custom role — blocked by default if it's currently assigned to users (with the affected users shown), or force-deleted (removing it from all holders in the same step) after confirming.

### New surfaces

- `/admin` — hub page, links to Users and Roles pages, back link to home.
- `/admin/users` — user list + role management, back link to `/admin`.
- `/admin/roles` — role list + create/delete, back link to `/admin`.
- A header nav link ("Admin" or similar), visible only to logged-in ADMINs, pointing at `/admin`.
- Backend endpoints: list users (paginated/searchable), grant/revoke role on a user, list roles, create role, delete role (with force-flag semantics).

All new pages are fully hidden (not merely disabled) for any user without the `ADMIN` role, matching the existing convention used for the create-award form.

## Done criteria

- An ADMIN can log in, reach `/admin` from the header, and from there reach `/admin/users` and `/admin/roles`.
- An ADMIN can search/paginate the user list, see each user's roles, and grant/revoke any role except `ADMIN` on any user.
- Attempting to grant or revoke `ADMIN` on any user — via UI or directly via API — is rejected server-side, for every user including already-ADMIN users.
- An ADMIN can create a custom role and see it appear in `/admin/roles` and as an assignable option on `/admin/users`.
- An ADMIN can delete a custom role; deletion is blocked with a list of affected users if the role is in use, and succeeds with a force flag after confirmation, removing it from all holders.
- `ADMIN` and `OPERATOR` roles can never be deleted via `/admin/roles` or its API.
- Non-ADMIN users (logged in or not) cannot reach any of the above via UI (hidden) or API (401/403).
- `POST /auth/signup` continues to work unauthenticated with no code changes.
- The `role` enum in `apps/api/src/db/schema.ts` is replaced by a real `roles` table, seeded with `ADMIN`/`OPERATOR`, with `user_roles` backfilled to reference it — without changing the shape of `roles: string[]` in the JWT, `AuthUser`, or `MeResponse`, and without requiring changes to the existing `RolesGuard`/`@Roles()` decorator or its usage on `AwardsController`.

## Out of scope

- A full dynamic permission system where custom roles carry their own configurable route/action permissions — custom roles are pure labels with no enforcement wiring in this feature.
- Granting `ADMIN` to a non-admin user through any UI/API — remains a direct-database operation only, exactly as today.
- Any change to `POST /auth/signup` or its guard status.
- Pinning down the exact route shape for role assignment/revocation endpoints, the pagination response shape (items/total/page/limit or equivalent), and the default page size for `GET /users` — these are implementation-level details left to the spec/tickets phase.

## Open questions

None raised beyond what's captured above as deferred to spec/tickets — those items are implementation-level, not ambiguous requirements, and are called out explicitly rather than decided here.

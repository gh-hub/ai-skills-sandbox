# Requirements: User Roles & Permissions

## Problem

Right now every logged-in user can create awards, and nobody can edit or delete them (the backend has PATCH/DELETE routes for awards, but they're unguarded and there's no frontend UI for them at all). There's no concept of privilege in the app — a user is just a user. We need a way to say "this person is allowed to manage awards" versus "this person can only view them," and we need to close the gap where PATCH/DELETE exist server-side but are wide open.

## Solution

Introduce two roles, `ADMIN` and `OPERATOR`, that can be attached to a user (a user can hold zero, one, or both). Roles travel with the user's session (in their JWT) so both the backend and frontend can check them without an extra lookup on every request.

- **Backend**: award mutation routes (create, update, delete) require the caller to be logged in *and* hold `ADMIN` or `OPERATOR`. Read routes stay open to everyone.
- **Frontend**: the award creation form, and new edit/delete controls on the awards list, are only shown to users who are logged in and hold one of those roles. Everyone else — including logged-out visitors — sees the read-only list, exactly as today.
- **Awards page** gets a back-to-home link, and the header gets small role badges next to a logged-in user's name so it's visible what they can do.

Role assignment itself is a database-only operation for now — there's no UI or endpoint to grant/revoke a role. New signups start with no roles (plain, read-only users) until someone manually inserts a row for them.

## Done criteria

- A user with a row in the new roles table for `ADMIN` or `OPERATOR` can create, edit, and delete awards; a user without one cannot (blocked with a 403 from the API, and the controls aren't rendered on the frontend at all).
- A logged-out visitor gets the same experience as today: read-only award list, no create/edit/delete UI, and a 401 if they somehow hit a mutation route directly.
- Existing users with a session cookie issued before this change keep working (treated as having no roles) — no forced logout is needed.
- The awards page has a working "back to home" link.
- A logged-in user's roles are visible as small badges next to their name in the header.
- Award edit goes through a confirmation step before the update is saved (in addition to the normal form submit), matching the explicit request for a belt-and-suspenders UX on edits.
- Award delete goes through a confirmation modal before the delete happens.

## Explicit out of scope

- No role-management UI (no screen to assign or revoke roles for a user).
- No API endpoint to assign or revoke roles — this is a direct-database operation only.
- No forced session invalidation for existing logged-in users when this ships.
- No new roles beyond `ADMIN` and `OPERATOR`.
- No changes to which routes are readable (`GET /awards`, `GET /awards/:id` stay open to everyone).
- No new page/route for award editing — it happens in a modal on the existing `/awards` page.

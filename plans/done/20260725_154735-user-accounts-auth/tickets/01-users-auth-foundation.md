# 01 — Users + auth API foundation

**What to build:** a new `users` module and table (id, name, email, password
hash, created at), following the same controller/service/repository/DTO
layering the `likes` module already uses, with a repository exposing insert,
find-by-email, and find-by-id. A new `auth` module exposes signup, login,
logout, and a "me" endpoint: signup validates name/email/password (password
minimum 6 characters, email format validated), hashes the password with
bcrypt, rejects a duplicate email as a conflict, and immediately establishes
a session on success — a visitor is logged in right after creating their
account, no separate login step. Login verifies the bcrypt hash and returns
the same generic failure whether the email is unknown or the password is
wrong, establishing a session on success. Both signup and login issue a JWT
set as an httpOnly session cookie (secure in production, sameSite=lax),
never returned in the response body; logout clears that cookie (there is no
server-side session store — the JWT itself is the session). "Me" reports the
session's user (id, name, email) when a valid cookie is present, and an
explicit "no session" response otherwise, so the frontend can restore
logged-in state after a reload without ever touching the token itself. This
ticket also builds the shared cross-cutting "current user or none" read that
any controller — including the likes module in ticket 02 — can consult
without owning its own cookie/JWT verification; anywhere except the "me"
endpoint's own reporting, a missing or invalid/expired cookie is always
treated as "no session," never an error. The JWT secret is read directly
from the environment, hard-failing at startup if absent, matching how this
codebase already reads its other required secret today. Covered by
service-level tests (mocked users repository) for hashing, credential
verification, and session-token issuance; repository-level tests (mocked
Drizzle chain) for insert/find-by-email/find-by-id; and a full-stack
integration test against real Postgres covering signup, login
success/failure, "me" with and without a cookie, and logout.

**Blocked by:** none — can start immediately

**Status:** ready

- [x] `users` table/migration exists, additive, generated via drizzle-kit — generated with a running Postgres (`drizzle-kit generate`, no hand-written SQL) as `apps/api/drizzle/0001_lying_true_believers.sql`; applied cleanly with `drizzle-kit migrate`
- [x] POST /auth/signup creates a user with a bcrypt-hashed password and sets an httpOnly session cookie; duplicate email returns a 409-style conflict
- [x] POST /auth/login verifies credentials and sets the same session cookie on success; wrong password and unknown email return the same generic failure
- [x] POST /auth/logout clears the session cookie
- [x] GET /auth/me returns the current user (id, name, email) when a valid session cookie is present, and an explicit "no session" response otherwise
- [x] A shared "current user or none" mechanism exists that other modules (e.g. likes) can consult without reimplementing cookie/JWT verification — see `apps/api/src/apps/auth/current-user.decorator.ts` (`CurrentUser` param decorator) backed by a global `CurrentUserGuard` (registered via `APP_GUARD` inside `auth.module.ts`, applies to every route including ticket 02's likes controller)
- [x] Service-level, repository-level, and full-stack integration tests pass, covering the behaviors above — 47/47 tests pass across the full `apps/api` suite (`pnpm --filter @thanks-claude/api test`)

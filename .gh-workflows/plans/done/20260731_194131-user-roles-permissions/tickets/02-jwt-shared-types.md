# 02 — JWT & shared-type roles claim

**What to build:** A logged-in user's roles ride inside their session JWT and come back out through `GET /auth/me`, so the frontend and backend can both read a user's roles without an extra database round trip per request.

**Blocked by:** 01 — Roles data model

**Status:** ready

- [ ] `SessionTokenPayload` gains a `roles: string[]` claim.
- [ ] `buildSession()` looks up the user's roles (via the roles-lookup method added to `UsersRepository` in ticket 01) and includes them both in the signed JWT payload and in the returned `AuthUser`. The roles lookup is async, which fits since `buildSession()` is already called from the async `signup()` and `login()` flows without changing either method's public shape.
- [ ] `verifySessionToken()` reads the `roles` claim and defaults it to `[]` when the claim is absent (rather than treating a missing claim as a verification failure), so JWTs issued before this feature shipped keep working without a forced logout.
- [ ] No change is made to `SESSION_MAX_AGE_MS`, session expiry, or the cookie itself — roles simply ride inside the existing signed payload.
- [ ] `AuthUser` (shared type) gains `roles: string[]`, which flows through to `MeResponse` with no separate contract change.
- [ ] `AuthUserDto` also declares `roles: string[]`, keeping it aligned with `AuthUser` and correct in the generated OpenAPI schema the frontend's typed API client consumes.
- [ ] `GET /auth/me` returns a logged-in user's roles as part of the response, with no new endpoint introduced.
- [ ] A unit test (in `auth.service.spec.ts`, mocked repository/JWT — no database needed) covers: a stale JWT with no `roles` claim verifies successfully as `roles: []`.
- [ ] A unit test covers: `buildSession()` includes the looked-up roles in both the signed token payload and the returned `AuthUser`.

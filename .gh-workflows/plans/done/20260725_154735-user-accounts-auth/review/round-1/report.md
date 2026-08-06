# Review Round 1

## Standards

**Config validation gap (`apps/api/src/apps/auth/jwt-secret.ts`, `auth.controller.ts`)** — **DEBT**
Given the pre-existing repo-wide absence of Joi/Zod/`ConfigService`, `JWT_SECRET` is read via a single isolated module that hard-fails at import time if missing — this is a reasonable stopgap and doesn't worsen the existing gap; it even centralizes the read the way a config layer eventually should. However, `auth.controller.ts`'s `buildSessionCookieOptions()` adds a **second, uncentralized** raw `process.env.NODE_ENV` read inside business/controller code rather than bootstrap/config code, scattering env access further instead of following the one-file pattern `jwt-secret.ts` set. Not a blocker since it matches existing repo conventions, but it's a step in the wrong direction.

**Misleading comment (`jwt-secret.ts`)** — **DEBT**
```
// Mirrors the DATABASE_URL pattern in `../../db/client.ts`: read directly from
// process.env and hard-fail at startup if the secret is missing.
```
`db/client.ts` does **not** hard-fail — it silently passes `undefined` to `Pool`. This WHY-comment asserts a false invariant about sibling code, which is worse than no comment (Comments rule: comments must be accurate/only for real WHY).

**Duplicated Code — test helpers (`apps/api/src/apps/auth/auth.spec.ts`, `apps/api/src/apps/likes/likes.spec.ts`)** — **DEBT**
`extractSessionCookie()` and `uniqueEmail()` are copy-pasted verbatim across both e2e spec files. Per the smell baseline, extract to a shared test-support module (e.g. `test/session.util.ts`).

**Utilities placement (`auth.controller.ts`)** — **DEBT (judgement call)**
`buildSessionCookieOptions()` is a free function that touches no `this`/DI and lives inside the controller file. Small enough to leave, but per the Utilities checklist it's a candidate for a `session.util.ts` alongside `session.constants.ts`, especially since it's shared logic used by both `signup` and `login`.

**Tests bundling multiple behaviors (`auth.service.spec.ts`, `likes.spec.ts` attribution tests)** — **DEBT (judgement call)**
E.g. "hashes the password, creates the user, and issues a session token" checks bcrypt call, repository call, JWT payload, and return shape in one test — matches the function's own "and" naming smell, and violates "one assertion per test where possible." Low priority; each assertion is still testing one cohesive outcome.

**No BLOCK-level findings.** Attribution flow (`likes.service.ts` explicit field mapping to avoid leaking `userId`), generic login-failure message, httpOnly/sameSite cookie flags, and the `credentials: "same-origin"` change with its accurate WHY-comment are all solid and standards-compliant.

## Spec

**(a) Missing / partial**

- **DEBT** — Backend password-length validation relies on `class-validator`'s default `@MinLength(6)` message (no custom `message:` option set in `apps/api/src/apps/auth/dto/signup.dto.ts`), so a client hitting the API directly (bypassing the frontend's zod copy) gets a generic framework string, not a tailored message. Spec: "As a visitor, I want a clear validation message when my password is shorter than 6 characters, so that I know why signup was rejected." The frontend duplicates the friendly copy via zod, but the API itself — the source of truth — doesn't carry it.

- **DEBT** — `UsersRepository.findById` (`apps/api/src/apps/users/users.repository.ts:28`) is implemented and unit-tested but never called from any production code path — `AuthService.verifySessionToken` and `CurrentUserGuard` derive the current user purely from the JWT payload claims (`sub`/`name`/`email`), never touching the DB. Spec: "The module exposes a repository (insert user, find by email, find by id) following the same controller/service/repository/DTO layering already used by the likes module." Defensible under the "stateless JWT" decision, but leaves dead code and means a user's session state never actually re-checks the DB.

**(b) Scope creep**

- **DEBT** — `apps/web/components/spark-mark.tsx` is fully rewritten (spokes/star-burst geometry replaced with a blocky rectangle logo traced from a 512×512 source image), completely unrelated to accounts/auth. Nothing in the spec ("Add basic accounts... Once logged in, the top-right spot shows an initials avatar plus a 'Log out' button") calls for a logo/brand-mark redesign; this is an unrelated visual change riding along in the same diff.

**(c) Implemented but questionable**

- No hard incorrectness found. Core mechanics check out: bcrypt hashing (never plaintext), httpOnly/sameSite=lax cookie never in JSON body, generic login-failure message for both unknown-email and wrong-password, global non-blocking `CurrentUserGuard` via `APP_GUARD` giving every controller "current user or none" without per-module cookie parsing, nullable `likes.user_id` with no dedup/unique constraint, feed join exposing only `attributedUserName` (not raw `user_id`), and matching unit/repository/integration/e2e test seams per the Testing Decisions section.

## Summary
BLOCK findings: 0
DEBT findings: 8
Worst BLOCK: none — no BLOCK-level findings in this round.

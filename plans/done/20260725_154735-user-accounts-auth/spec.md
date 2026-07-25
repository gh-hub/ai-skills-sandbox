# Spec: user-accounts-auth

## Problem Statement

"Thanks, Claude" is fully anonymous today: a visitor can click Like and
optionally attach a story, but there is no notion of who they are. Nothing
ties two likes/stories together as coming from the same person, and the
public story feed can't put a name to any of them. A visitor who wants an
identity on the site — so their appreciation is visibly theirs — has no way
to get one.

## Solution

Add basic accounts. A visitor can open a "Log in" control in the top-right of
the existing hero card and, from the same modal, switch to "Create account."
Signing up takes a name, email, and password and logs the visitor in
immediately; logging in takes email and password. Once logged in, the
top-right spot shows an initials avatar plus a "Log out" button instead of
"Login," and every like/story the visitor submits from then on is attributed
to their account. The public story feed shows an initials avatar and full
name next to attributed stories, and an anonymous icon next to stories with
no account behind them. Anyone who skips signing up keeps liking/sharing
exactly as they do today — attribution is additive, not required.

## User Stories

1. As a visitor, I want to open a "Log in" modal from the hero card, so that
   I can create an account or sign in without leaving the page.
2. As a visitor, I want to switch between "Log in" and "Create account"
   inside that same modal, so that I don't have to hunt for a separate
   signup page.
3. As a visitor, I want to create an account with just a name, email, and
   password, so that signing up is quick and low-friction.
4. As a visitor, I want a clear validation message when my password is
   shorter than 6 characters, so that I know why signup was rejected.
5. As a visitor, I want to be logged in immediately after creating my
   account, so that I don't have to sign up and then log in as two separate
   steps.
6. As a returning visitor, I want to log in with my email and password, so
   that I can access my identity on the site again.
7. As a visitor, I want a clear error when I log in with the wrong email or
   password, so that I know the attempt failed (without the message
   revealing whether the email exists).
8. As a logged-in visitor, I want the hero card's top-right spot to show my
   initials avatar and a "Log out" button in place of "Login," so that I can
   see at a glance that I'm signed in.
9. As a logged-in visitor, I want to click "Log out" and see the "Login"
   button reappear, so that I can end my session when I'm done.
10. As a logged-in visitor, I want my session to survive a page reload, so
    that I don't have to log in again every time I refresh.
11. As a logged-in visitor, I want my Like/story submissions to be tied to my
    account, so that the story feed can show it's mine.
12. As a logged-in visitor, I want to be able to like/share as many times as
    I want, so that logging in doesn't impose a limit that anonymous use
    doesn't have.
13. As a visitor who isn't logged in, I want my Like/story to still be
    recorded (anonymously), so that logging in isn't a requirement to
    participate.
14. As any visitor browsing the story feed, I want to see an initials avatar
    and name next to attributed stories, so that I can tell who left them.
15. As any visitor browsing the story feed, I want to see a distinct
    anonymous icon next to stories with no account behind them, so that
    anonymous and attributed stories are visually distinguishable.
16. As a developer, I want passwords stored only as bcrypt hashes, never in
    plaintext, so that an account/database compromise doesn't directly leak
    credentials.
17. As a developer, I want the session token kept in an httpOnly cookie, out
    of reach of frontend JS, so that an XSS bug can't be used to steal
    sessions.

## Implementation Decisions

**New `users` module and table.** A new `users` module is added alongside
the existing `likes` module, with its own Drizzle table: `id` (uuid, primary
key, default random), `name` (text, required), `email` (text, unique,
required), `password_hash` (text, required), `created_at` (timestamptz,
default now). No other columns — no profile fields, no roles. The migration
is generated the same way the existing `likes` migration was (via the
project's drizzle-kit generate step), not hand-written, and is additive only:
existing data is untouched. The module exposes a repository (insert user,
find by email, find by id) following the same
controller/service/repository/DTO layering already used by the likes module,
with no persistence logic living in the auth module itself.

**New `auth` module: signup, login, logout, me.** A separate `auth` module
owns the HTTP surface for authentication: create-account, log-in, log-out,
and a "who am I" endpoint, plus the password-hashing and session-issuing
logic. It depends on the users module for persistence but does not own the
`users` table itself, keeping persistence and auth-flow concerns in separate
modules the way `likes` already separates its repository from its
controller/service.

- Signup takes name, email, password; validates password length (minimum 6
  characters, no other complexity rule) via `class-validator`, matching the
  validation style already used in the likes DTOs; hashes the password with
  bcrypt before persisting; and, on success, immediately establishes a
  session (see below) — the visitor is logged in without a separate login
  step. A signup attempt with an email that's already registered is rejected
  as a conflict.
- Login takes email, password; verifies the password against the stored
  bcrypt hash; on success establishes a session the same way signup does. On
  failure (unknown email or wrong password), the response does not
  distinguish which one was wrong.
- Logout clears the session cookie; no server-side session store to purge
  since the JWT itself carries the session.
- The "who am I" endpoint reports the current session's user (id, name,
  email) when a valid session cookie is present, and reports "no session"
  otherwise; the frontend calls it once on load to restore logged-in state
  after a reload, since the cookie itself is httpOnly and unreadable from
  frontend JS.

**Session mechanism (per ADR-001).** On successful signup or login, the API
issues a JWT and sets it as an httpOnly cookie (secure in production,
sameSite) — never in a JSON response body, never touched by frontend JS.
Logout clears that cookie. This is a stateless session: the JWT itself
(subject = user id) is the source of truth, verified on each request; there
is no server-side session table to invalidate on logout beyond clearing the
cookie, which is consistent with this feature's "really basic" scope (no
token revocation, no refresh tokens).

**Optional-session read used across modules.** Creating a like/story needs
to know, for any request, whether it came from a logged-in visitor — but
must never reject or degrade an unauthenticated request, since anonymous
submission stays fully supported. This is implemented as a single
cross-cutting mechanism (session-cookie verification wired in once at the
application level) that any controller can consult to get "the current
user, or none" without every module owning its own cookie-parsing/JWT-
verification logic. The auth module owns the verification logic; the likes
module (and any future module) consumes it through that one shared seam
rather than reimplementing it. A missing or invalid/expired cookie is always
treated as "no session" — quietly, not as an error — for every endpoint
except the "who am I" endpoint, which reports "no session" as its own
explicit, expected response rather than a failure.

**New runtime dependencies.** The API currently has zero auth-related
dependencies. This feature adds: bcrypt (password hashing), a JWT
library for signing/verifying the session token, and cookie-parsing support
so the session cookie set on the response can be read back off later
requests. These are the first auth-related dependencies in this codebase and
establish the pattern (env-var-sourced secret, no server-side session store)
that any future auth-adjacent work should follow.

**JWT secret sourcing.** The signing secret comes from an environment
variable, following the pattern this codebase already uses for its only
other required secret-like config value (`DATABASE_URL`): read directly from
the environment with a hard failure at startup if it's missing, rather than
introducing a configuration-module abstraction that doesn't exist in this
codebase today.

**`likes.user_id` — nullable FK, no dedup (per ADR-001).** A new nullable
`user_id` column on `likes` references `users.id`. When a like/story is
created during a request with a valid session, `user_id` is set to that
user's id; otherwise it's left null, identical to every row that exists
today. There is no uniqueness constraint — a logged-in visitor can
like/share any number of times, matching today's unlimited anonymous
behavior exactly. This is a backward-compatible, additive migration: all
existing rows remain anonymous.

**Attribution surfaced on the story feed.** The story-feed API response
gains, per item, the display name of the attributing user when one exists
(null otherwise) — sourced via a join from `likes.user_id` to `users` at the
repository layer, alongside the existing story/hoursSaved fields. Only the
name is exposed on this public endpoint; the raw user id is not, since
nothing on the public feed needs it and there's no reason to expose more
than the UI requires. The shared `Like`/`LikesPage` types
(`packages/shared-types`) and the corresponding API DTOs gain this field.
Shared types also gain the request/response shapes for signup, login, and
"who am I" (name/email/password in, and an id/name/email user shape out),
mirroring how `CreateLikeRequest`/`Like` are already shared between API and
web.

**Frontend: a new Dialog primitive.** No dialog/modal component exists in
`apps/web/components/ui/` today, though `radix-ui` is already a dependency
(currently used only for the `Slot` primitive inside the Button component).
This feature adds a reusable Dialog wrapper built on radix-ui's dialog
primitive, styled consistently with the existing form/input/button
components, since the login/signup modal needs it and no future feature has
built one yet.

**Frontend: the auth modal.** A single modal component, opened from the
hero-card header, holds both the login and signup forms behind a toggle —
one modal, not two separate flows — using the same form-building pattern
already used for the story-share form (`react-hook-form` + `zod` resolver +
the shared `Form`/`FormField` components). On successful login or signup, the
modal closes and the app's notion of "current user" is refreshed so the
header updates immediately.

**Frontend: header login/logout state.** The hero card's header row
(top-right, alongside the existing three decorative dots and title) shows a
"Login" button that opens the auth modal when logged out, and an initials
avatar plus a plain "Log out" button when logged in — no new nav bar, no
greeting text. This state is driven by the "who am I" query, called once on
load so a reload preserves the logged-in state without the frontend ever
touching the session token itself.

**Frontend: avatars on the story feed.** `StoryFeed`/`StoryCard` renders an
initials avatar (derived from the attributing user's name) plus their full
name for attributed stories, and a `lucide-react` anonymous icon for stories
with no attributed user — using the new per-item name field from the feed
API. The initials-avatar presentation is shared (as one component/style)
between the story feed and the logged-in header state, so the two stay
visually consistent by construction rather than by convention.

## Testing Decisions

Test seams follow the ones already established by the `likes` module, at the
highest level that fits each behavior:

- **Unit tests (service level, repository mocked)** — mirroring
  `likes.service.spec.ts`: the auth service's password-hashing call,
  credential-verification logic (right password vs. wrong vs. unknown
  email), and session-token issuance are tested against a mocked users
  repository, the same way `LikesService` is tested against a mocked
  `LikesRepository`.
- **Unit tests (repository level, mocked db chain)** — mirroring
  `likes.repository.spec.ts`'s chained-mock pattern: the new users
  repository's insert/find-by-email/find-by-id calls, and the likes
  repository's extended feed query (now joining to `users`), are tested
  against a mocked Drizzle chain the same way.
- **Full-stack integration tests against a real Postgres** — mirroring
  `likes.spec.ts` (testcontainers + supertest against the real Nest app):
  this is the highest seam that can exercise the parts that matter most and
  cut across modules — signup persists a real row and sets a real cookie;
  login with correct/incorrect credentials; the "who am I" endpoint reflects
  an issued cookie and reports no session otherwise; logout clears the
  session; and, most importantly, creating a like/story while an
  authenticated cookie is present attaches the right `user_id`, while doing
  so without one leaves `user_id` null — proving the optional-session read
  and the nullable FK work end-to-end without over-specifying internals.
- **Playwright e2e specs** (`apps/e2e/tests/`) — mirroring
  `like-flow.spec.ts`/`story-form-flow.spec.ts`'s page-level, role-query
  style: signing up through the modal and seeing the header switch to
  avatar + "Log out"; logging in with an existing account; logging out and
  seeing "Login" reappear; a page reload preserving logged-in state; and a
  logged-in visitor's submitted story showing their avatar + name on the
  feed versus an anonymous story showing the anonymous icon. This is the
  right seam for anything about what the visitor actually sees and clicks,
  same as the existing like/story-form/story-feed specs.

Tests should assert observable behavior (response shape, cookie presence,
feed content, what's rendered) rather than internals like exact SQL or
hashing implementation details — consistent with how the existing likes
tests are written.

## Out of Scope

- Password reset.
- Email verification.
- Rate limiting or lockout on login attempts.
- OAuth / social login.
- Profile editing (no way to change name/email/password after signup).
- Any one-like-per-user limit, unlike/toggle semantics, or dedup on likes.
- A server-side session store or token revocation/refresh mechanism beyond
  the JWT's own expiry.

## Further Notes

- **No `ConfigService` actually exists in this codebase.** The grill's
  gotcha note pointed at `db.module.ts`/`ConfigService` as the pattern to
  follow for the JWT secret, but there is no `@nestjs/config` dependency and
  no `ConfigService` anywhere in `apps/api` — `DATABASE_URL` is read directly
  from `process.env` with a thrown error if it's missing (see
  `drizzle.config.ts`, `db/client.ts`). This spec follows that actual
  pattern (direct `process.env.JWT_SECRET` read, hard failure if absent)
  rather than the ConfigService pattern the gotcha described, since the
  latter doesn't exist here. Flagging in case this was meant to imply
  introducing `@nestjs/config` as part of this feature — that would be new
  scope not otherwise motivated by anything in the grill output.
- **JWT library choice (`@nestjs/jwt` vs. raw `jsonwebtoken`) wasn't decided
  by the ADR** — it names both as options. This spec leans toward
  `@nestjs/jwt` for DI-based consistency with the rest of this NestJS-native
  codebase, but either satisfies the ADR; worth confirming at tickets time.
- **Exact `sameSite` cookie value** (`lax` vs. `strict`) isn't specified
  beyond "sameSite" in the ADR. `lax` is the more common default for
  first-party session cookies and is assumed here; flagging as an open call
  rather than a confirmed decision.
- **JWT/session expiry length isn't specified anywhere in the grill output.**
  Something reasonable (e.g. on the order of days, not minutes or years)
  will need a concrete number at tickets/implement time since there's no
  refresh-token mechanism in scope to renew it silently.
- **Duplicate-email signup conflict response shape** (status code, error
  message) isn't specified by the grill; a 409-style conflict response is
  the natural fit but the exact shape is left to ticket-level detail.
- **Email format validation on signup** wasn't explicitly discussed in the
  grill (only password length was called out as a validation rule). This
  spec assumes basic email-format validation on the signup DTO is desired
  since `email` is a real, unique-constrained field — but that's an
  assumption beyond what was explicitly confirmed, not a grilled decision.
- **Whether the story feed's per-item field should be a nested user object
  or a flat name field** wasn't specified beyond "the associated user's name
  (or null)." This spec assumes a flat nullable name field is enough since
  only name + initials are used on the feed today; revisit if a future
  feature needs more than the name (e.g. linking to a profile).

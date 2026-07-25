# Decisions: user-accounts-auth

## Decision: New `users` table

Decided: Add a new `users` table via a new NestJS module under
`apps/api/src/apps/` and a new Drizzle table, with columns `id` (uuid, pk,
default random), `name` (text, required), `email` (text, unique, required),
`password_hash` (text, required), `created_at` (timestamp with timezone,
default now). No other fields.

Why: Keeps the new entity intentionally minimal — just enough to support
signup/login and attribution, nothing speculative.

## Decision: Signup included, combined into the login modal

Decided: Signup is in scope, implemented as a toggle/tabs between "Log in" and
"Create account" inside one modal component. Signup fields: name, email,
password. Login fields: email, password.

Why: Something has to be able to create a user in the first place.

Alternatives rejected: Login-only with no signup UI — rejected because nothing
could create a user otherwise.

## Decision: Password rules — minimum 6 characters, no other complexity

Decided: Passwords must be at least 6 characters, with no other complexity
requirements (no uppercase/symbol rules), enforced via `class-validator` on the
signup DTO, matching the existing DTO style in `apps/api/src/apps/likes/dto/`.

Why: Matches the "really basic" scope of the feature; avoids over-engineering
validation for a low-stakes appreciation site.

## Decision: Password hashing via bcrypt

Decided: Use bcrypt to hash passwords.

Why: More common and simpler choice for this NestJS codebase, which currently
has no auth libraries installed at all (no bcrypt, no passport, no
jsonwebtoken).

Alternatives rejected: argon2 — not chosen; bcrypt is simpler and more
familiar for this codebase's scope.

## Decision: Session via JWT in an httpOnly cookie

Decided: On successful login or signup, the API issues a JWT set as an
httpOnly, secure-in-production, sameSite cookie — not returned in the response
body and not stored in localStorage. This requires a "who am I" endpoint
(e.g. `GET /auth/me`) so the frontend can restore login state after a page
reload, since the cookie is httpOnly and unreadable from JS. The JWT secret is
sourced from an environment variable, following whatever env-config pattern
the API already uses for things like `DATABASE_URL`.

Why: Keeps token handling out of frontend JS entirely, avoiding XSS exposure
of the session token.

Alternatives rejected: JWT in response body + localStorage + Authorization
header — rejected due to XSS exposure and to keep token handling out of
frontend JS entirely.

## Decision: `likes.user_id` — nullable FK, no dedup

Decided: Add `likes.user_id` as a new nullable FK column referencing
`users.id`. When a like/story is created with a valid session, `user_id` is
set to that user's id; when anonymous, it stays null. No like-uniqueness or
dedup constraint — likes remain unlimited per user, same as today's fully
anonymous behavior.

Why: Anonymous submission must remain fully supported and unchanged; keeping
likes unlimited matches today's behavior and avoids scope creep into
unlike/toggle semantics.

Alternatives rejected: One-like-per-user with unlike/toggle semantics —
rejected as bigger scope than "really basic" calls for.

## Decision: Avatars on the story feed

Decided: In `StoryFeed`/`StoryCard` (`apps/web/components/story-feed.tsx`),
when a story's like row has an associated user, render a small initials
avatar (from the user's `name`) plus their full name next to the story,
styled like a typical review byline. When there is no associated user, render
an anonymous icon from `lucide-react` instead of a custom SVG. This requires
the likes list API response to include the associated user's name (or null)
per item, via a join from `likes.user_id` to `users` in the repository layer,
plus a corresponding field on the shared `Like`/`LikesPage` types in
`packages/shared-types/src/index.ts` and the `LikeDto`/`LikesPageDto` in
`apps/api/src/apps/likes/dto/`.

Why: Gives the story feed a visual cue for who left a story, consistent with
a typical review byline, while keeping anonymous stories clearly distinct.

## Decision: Header UI placement — top-right of hero card

Decided: The Login control lives in the top-right of the existing hero
"terminal" card's header row (`apps/web/app/page.tsx`, the `div` with the
three decorative dots and the "Thanks, Claude (code)" title), not a new
separate nav bar.

Why: A single control doesn't warrant a whole new nav bar element.

Alternatives rejected: A whole new nav bar element — rejected as heavier than
needed for one control.

## Decision: Logged-in state — avatar + "Log out", not a greeting

Decided: When logged in, the same top-right hero spot replaces the "Login"
button with an initials avatar (same visual style as the review byline
avatar) plus a plain "Log out" text button.

Why: Visual consistency with the review avatars used elsewhere on the page.

Alternatives rejected: "Hi {name}" text greeting instead of an avatar —
rejected in favor of visual consistency with the review avatars.

## Decision: Scope boundaries

Decided: No password reset flow, no email verification, no rate
limiting/lockout on login attempts, no OAuth/social login, no profile editing.
The feature is limited to: signup, login, logout, likes/stories attributed to
a user id, and avatars on the story feed.

Why: Keeps the feature "really basic" as scoped, avoiding building out a full
account-management system for a small appreciation site.

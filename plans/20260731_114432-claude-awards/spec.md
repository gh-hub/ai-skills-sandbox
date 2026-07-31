# Spec: claude-awards

## Problem Statement

Today, someone saying thanks to Claude Code can either hit a one-click Like, or
expand the story form to add free-text detail (story + hours saved). Neither path
lets them call out *what kind* of help they got — was it a gnarly bug fix, a speed
boost, a patient explanation? There's also no single place to see what kinds of help
people recognize most, or how often each kind has been given.

## Solution

Introduce "awards" — small, reusable badges (icon + title + description, e.g. 🐛
"Bug Slayer") that can be optionally attached to a shared thanks story. A new
`/awards` page lists every award with a live count of how many stories carry it, and
lets logged-in users add new awards to the set. The story form gains an optional
multi-select so a story can carry zero, one, or many awards; the story feed shows a
badge for each award attached to a given entry. The one-click Like button is
untouched.

## User Stories

1. As any site visitor, I want to see the full list of awards with icon, title,
   description, and how many times each has been given, so that I can see what kinds
   of help are most valued.
2. As any site visitor, I want the one-click Like button to keep working exactly as
   it does today, so that saying a quick thanks stays frictionless.
3. As any site visitor sharing a story, I want to optionally select any number of
   existing awards (via checkboxes showing icon + title) before submitting, so that I
   can call out specifically what kind of help I got.
4. As any site visitor sharing a story, I want award selection to be entirely
   optional (same as story text and hours saved), so that I'm not forced to pick one
   just to share a quick note.
5. As any site visitor browsing the story feed, I want to see a badge (icon + title)
   for every award attached to a story, so that I can tell at a glance what kind of
   help each person is celebrating.
6. As a logged-in user, I want to create a new award (title, description, optional
   icon) from the `/awards` page, so that I can add a recognition type that doesn't
   exist yet.
7. As a logged-in user who just created an award, I want it to be immediately
   selectable on the story form, so that I can use it right away without a page
   reload.
8. As an anonymous visitor on the `/awards` page, I want to see a prompt that opens
   the existing login/signup modal instead of a create form, so that I understand I
   need to log in and can do so without leaving the page.
9. As a site visitor, I want an award without a custom icon to still display with a
   sensible default icon everywhere it appears, so that the UI never shows a blank
   or broken-looking badge.
10. As a developer maintaining this codebase, I want the awards backend module to
    follow the same structural conventions as the existing `likes` module
    (controller/service/repository/dto/tests), so that the codebase stays
    consistent and predictable.
11. As a developer maintaining this codebase, I want deleting an award to clean up
    its attachments without touching the thanks stories it was attached to, so that
    removing a badge type never destroys someone's story.

## Implementation Decisions

### Schema

- New `awards` table, mirroring the `likes` table's conventions: `id` (uuid, default
  random, PK), `createdAt` (timestamptz, default now), `title` (text, required),
  `description` (text, required), `icon` (text, optional/nullable — no DB-side
  default; the blank-icon fallback is a frontend rendering concern only).
- New many-to-many join table, finalized as `like_awards` (matching the two-plural,
  underscore-joined style already used elsewhere in the schema): `id` (uuid PK),
  `like_id` (uuid, required, FK → `likes.id`), `award_id` (uuid, required, FK →
  `awards.id`). No `createdAt` — the join row's existence is all that matters.
- Cascade behavior on the join table's two FKs is deliberately asymmetric and must
  not be copy-pasted from each other or from `likes.userId → users.id` (which does
  not cascade):
  - `like_id → likes.id` — `ON DELETE CASCADE`. Deleting a thanks story removes its
    join rows.
  - `award_id → awards.id` — `ON DELETE CASCADE`. Deleting an award removes its join
    rows from every story it was attached to; the `likes` rows themselves, and their
    `story`/`hoursSaved`/`userId` content, are left completely untouched. This is
    the full implementation of the "cascade cleanup only" decision from the grill —
    it requires no application-level cleanup code, the FK does it.
- Both new tables and the 7 seed rows for `awards` ship in one Drizzle migration
  (next number after `0002_brainy_tusk.sql`), keeping schema and initial data
  versioned together as one deployable unit rather than splitting schema-only and
  seed-only migrations.

### Backend module (`apps/api/src/apps/awards/`)

- Mirrors `apps/api/src/apps/likes/` structure exactly:
  `awards.module.ts`, `awards.controller.ts` (`@Controller("awards")`),
  `awards.service.ts` (thin orchestration, no Drizzle calls), `awards.repository.ts`
  (all Drizzle query logic behind `@Inject(DATABASE_CONNECTION)`), `dto/` (DTO
  classes with `class-validator` decorators and `@nestjs/swagger`
  `@ApiProperty`/`@ApiPropertyOptional`). Registered in `AppModule` alongside
  `LikesModule` and `AuthModule`.
- Endpoints (full CRUD, per the grill decision to mirror `likes` completely even
  though the UI only wires up list + create):
  - `GET /awards` — returns every award, unpaginated (small, slow-growing resource;
    7 at launch, occasional user additions — pagination would be premature
    complexity here, unlike the fast-growing `likes` feed). Each item includes a
    `givenCount`: how many `like_awards` rows reference it.
  - `GET /awards/:id` — single award with the same shape, including `givenCount`.
  - `POST /awards` — creates an award. Requires a logged-in user (see Auth below).
    `title` and `description` are required non-empty strings; `icon` is optional.
    Returns the created award with `givenCount: 0`.
  - `PATCH /awards/:id` — partial update of `title`/`description`/`icon`. Open,
    unauthenticated, matching how `likes` has no auth on its mutating-adjacent
    reads today and per the explicit grill decision not to gate this yet.
  - `DELETE /awards/:id` — deletes the award; the `award_id` cascade removes its
    join rows automatically. Open, unauthenticated. Returns 204 No Content (no
    existing DELETE endpoint in the codebase to match precedent against; this is
    the standard Nest/REST default for a body-less success response).
- Response DTOs return plain classes directly (no envelope), consistent with
  `LikeDto`/`LikesPageDto` today.

### Mandatory-auth guard (new precedent)

- `POST /awards` is the first endpoint in this codebase requiring a logged-in user,
  not just an optional identity. The existing `CurrentUserGuard` (registered
  globally via `APP_GUARD` in `auth.module.ts`) is non-blocking by design — it only
  populates `request.user` (or `null`) and always returns `true`.
- A new, separate guard is added in `apps/api/src/apps/auth/` (e.g.
  `require-auth.guard.ts`) that reads `request.user` (already populated by the
  global `CurrentUserGuard`, which always runs first as an app-level guard) and
  throws an `UnauthorizedException` (401) when it is `null`; otherwise allows the
  request through. It is applied with `@UseGuards(...)` at the method level, only
  on `POST /awards` — not globally, and not on any other endpoint. This keeps the
  existing optional-auth behavior for every other route untouched and establishes
  the reusable pattern for any future login-required endpoint.

### Attaching awards to a thanks story

- `POST /likes` gains a new optional field, `awardIds: string[]` — zero or more
  award UUIDs to attach to the story being created. This is additive to the
  existing `story`/`hoursSaved` optional fields; omitting it (or sending an empty
  array) behaves exactly as today.
- `CreateLikeDto` validates `awardIds` as an optional array of UUID strings.
- `LikesService.create` wraps the like insert and the join-row inserts in a single
  DB transaction: if any `awardId` doesn't correspond to an existing award, the
  whole submission fails (400) and no `likes` row is created — avoiding a
  partially-attributed story or a silent drop of an invalid selection. This is
  the one place a request can fail because of award data, so it's handled
  explicitly rather than left to a raw FK-violation error bubbling up.
- The response shape for a like (`LikeDto`, used by both `POST /likes` and every
  item in `GET /likes`) gains an `awards` field: an array of `{ id, title, icon }`
  for every award attached to that story (no `description` — badges only need icon
  + title). This keeps the create response and the feed response symmetric and
  gives the frontend everything it needs to render badges without a second
  round-trip.
- `LikesRepository`'s feed query (`getStoryPage`) fetches the page of stories as it
  does today, then runs one additional query joining `like_awards` → `awards` for
  just the like IDs on that page, and groups the results in application code. This
  avoids introducing SQL-level JSON aggregation into a codebase that currently has
  none, keeping the new code readable alongside the existing plain-Drizzle style.

### Frontend

- New route `apps/web/app/awards/page.tsx`:
  - Fetches and lists all awards (icon — falling back to a shared default when
    blank — title, description, give-count).
  - Uses the existing `useMe()` hook to branch: logged-in users see a create-award
    form (title, description, optional icon) below the list; anonymous visitors see
    a "log in to create an award" prompt paired with the existing `AuthModal`
    component, reused unmodified (its own "Login" trigger button), rather than
    adding trigger-customization props to `AuthModal` just for one caller.
  - A successful create invalidates the same awards-list query used by the story
    form's picker, so the new award is immediately selectable there too — this is
    what makes requirement 7 ("immediately selectable afterward") work, via shared
    React Query cache rather than any special-cased refresh logic.
  - A link to `/awards` is added to the root layout's header (next to the existing
    theme toggle), since no navigation currently exists to reach any route other
    than `/`.
- Story form (`apps/web/app/page.tsx`): gains an award multi-select (checkboxes,
  each showing icon + title) sourced from the same awards-list query, wired into
  the existing `react-hook-form` schema as an optional `awardIds: string[]`
  (defaulting to `[]`). Selected IDs are passed through in the `storySubmit.mutate`
  call. No changes to the one-click Like button or its `likeSubmit.mutate({})` call.
- Story feed (`apps/web/components/story-feed.tsx`): `StoryCard` renders a badge
  (icon + title) for each entry in the item's `awards` array, alongside the
  existing story text and hours-saved line.
- A single shared helper (e.g. in `apps/web/lib/utils.ts`) resolves an award's
  display icon, applying the default fallback (e.g. 🎖️) whenever `icon` is blank —
  used by the feed badges, the `/awards` list, and the story-form picker, so the
  fallback logic exists in exactly one place.

### Shared types (`packages/shared-types/src/index.ts`)

- New `Award` type: `{ id, createdAt, title, description, icon: string | null,
  givenCount: number }`.
- New `CreateAwardRequest` type: `{ title: string; description: string; icon?:
  string }`.
- New `AwardSummary` type: `{ id, title, icon: string | null }` — the shape embedded
  in `Like`/`LikeFeedItem` for badge rendering.
- `CreateLikeRequest` gains `awardIds?: string[]`.
- `Like` (and by extension `LikeFeedItem`) gains `awards: AwardSummary[]`.

## Testing Decisions

Test at the same seams the existing feature already uses — no new test
infrastructure is introduced.

- **Backend integration** (`apps/api/src/apps/awards/awards.spec.ts`), following the
  Testcontainers + Supertest pattern in `likes.spec.ts`: full CRUD round-trip,
  `givenCount` reflecting actual join-row counts, `POST /awards` returning 401
  without a session cookie and 201 with one (same session-cookie extraction helper
  pattern used in `likes.spec.ts`'s attribution tests and `auth-flow.spec.ts`),
  `PATCH`/`DELETE` remaining reachable without a session, and deleting an award
  removing its `like_awards` rows while leaving the referencing `likes` rows'
  content intact.
- **Backend unit tests**: `awards.service.spec.ts` and `awards.repository.spec.ts`,
  mirroring the mocked-dependency style of `likes.service.spec.ts` /
  `likes.repository.spec.ts`.
- **Backend integration additions to the `likes` module**: extend `likes.spec.ts`
  (or add a sibling describe block) to cover `POST /likes` with `awardIds` —
  attaching one and multiple awards, the created/feed response including the
  right `awards` array, an unknown `awardId` failing the whole request with no
  `likes` row created, and an empty/omitted `awardIds` behaving exactly as before.
- **Frontend behavior**: this codebase has no component-level test seam for
  `apps/web` today (no existing `*.test.*`/`*.spec.*` files there) — behavior is
  verified end-to-end via Playwright, so new UI behavior is tested there:
  - A new `apps/e2e/tests/awards-page.spec.ts`, following the structure of
    `story-feed.spec.ts`/`stats-band.spec.ts`: visiting `/awards` shows the 7
    seeded awards with counts; an anonymous visitor sees the login prompt, not the
    create form; a logged-in user (reusing the login flow from `auth-flow.spec.ts`)
    can create an award and see it appear in the list.
  - A new `apps/e2e/tests/story-award-picker.spec.ts`, following the structure of
    `story-form-flow.spec.ts`: selecting one or more award checkboxes and
    submitting the story shows the corresponding badge(s) on the resulting feed
    entry; submitting with no awards selected behaves exactly as
    `story-form-flow.spec.ts` already verifies today.

## Out of Scope

- No edit or delete UI anywhere in the app. `PATCH`/`DELETE /awards/:id` exist on
  the backend only.
- No admin or role system — this feature does not introduce one, and none of its
  authorization logic depends on one.
- No login requirement anywhere except `POST /awards`. Viewing awards, giving
  thanks, and attaching existing awards to a story all remain open to anonymous
  visitors.
- No changes to the one-click Like button flow (`likeSubmit.mutate({})`) — it stays
  exactly as it is today, with no award picker.
- No pagination on `GET /awards` in this iteration (see Implementation Decisions).
- No search/filter/sort controls on the `/awards` page.

## Further Notes

- **Open question — unknown `awardId` handling on `POST /likes`:** the grill output
  doesn't specify what should happen if a client sends an `awardId` that doesn't
  exist (e.g. deleted between page load and submit). This spec makes the call to
  validate inside a transaction and fail the whole request with 400, rather than
  silently dropping the bad ID or letting a raw FK error surface — revisit if
  product wants a softer "attach what's valid, ignore the rest" behavior instead.
- **Open question — join table name:** the ADR left `like_awards` as a "working
  name, to be finalized at spec time." This spec finalizes it as `like_awards`
  (matching the plural-plural, underscore-joined convention already visible
  elsewhere in the schema). No existing naming convention in this codebase
  contradicts that choice.
- The mandatory-auth guard introduced for `POST /awards` is the first of its kind
  in this codebase. Its shape (throwing 401 off of `request.user` populated by the
  existing global `CurrentUserGuard`) is intended to be the reusable pattern for
  any future login-required endpoint — worth flagging in review since there's no
  prior art to compare it against.
- The `/awards` link added to the root layout header is a small, otherwise-unasked
  navigation change, needed purely because no route besides `/` is currently
  reachable from the UI. Flagging it explicitly since it wasn't called out in the
  grill requirements.

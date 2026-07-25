# Progress: user-accounts-auth

## Current phase
Plan complete (done 2026-07-25)

## Current ticket path
(none)

## Phases
- [x] grill (done 2026-07-25)
- [x] spec (done 2026-07-25)
- [x] tickets (done 2026-07-25)
- [x] implement/01-users-auth-foundation (done 2026-07-25)
- [x] implement/02-likes-attribution-api (done 2026-07-25)
- [x] implement/03-auth-modal-header (done 2026-07-25)
- [x] implement/04-story-feed-avatars (done 2026-07-25)
- [x] review/round-1/tickets (done 2026-07-25)
- [x] review/round-1/decide (done 2026-07-25)

## Review rounds
- Round 1 (done 2026-07-25): 0 BLOCK, 8 DEBT. See
  `review/round-1/report.md`. DEBT findings logged to
  `review/tech-debt.md`. No tickets written (no BLOCK findings). Current
  phase advanced to `review/round-1/decide`.
- Round 1 decide (done 2026-07-25): user decision recorded verbatim: "done".
  All 8 DEBT findings exported to `plans/tech-debt/` (see `review/tech-debt.md`
  for the moved-to paths). **Plan complete (done 2026-07-25).**

## Last session end-state
`review/round-1/tickets` complete (2026-07-25). Diff reviewed was `git diff
HEAD` (working-tree changes on top of HEAD `078aec5`, since this plan's
ticket work was never committed, per the workflow's "never commit during
implement" rule — includes all of tickets 01-04 across `apps/api`,
`apps/web`, `apps/e2e`, `packages/shared-types`). Two parallel sub-agent
reviews ran (Standards axis: general.md + node-typescript-docker.md +
nestjs-service-style review checklist + smell baseline; Spec axis: full
`spec.md`). Result: **0 BLOCK findings, 8 DEBT findings** — see
`review/round-1/report.md` for full detail (Standards and Spec sections
verbatim) and `review/tech-debt.md` for the logged DEBT list. No tickets
were written under `review/round-1/tickets/` since there were no BLOCK
findings. Current phase advanced to `review/round-1/decide` — next
session should run `phases/review-decide.md` live with the user.

## Last session end-state
Ticket 04 complete (2026-07-25) — **all 4 original tickets now implemented.**
This was the last ticket in the plan; current phase has been advanced to
`review/round-1/tickets` per the workflow rule (all original tickets done,
no review round started yet).

**Ticket 04 — what was built (all in `apps/web`/`apps/e2e`, frontend only):**
- `apps/web/components/story-feed.tsx`: added a `StoryByline` sub-component
  used inside `StoryCard`, rendered above the story text. When the feed
  item's `attributedUserName` is non-null: renders `<UserAvatar
  name={attributedUserName} size="sm" />` (the exact shared component from
  ticket 03, imported from `@/components/user-avatar` — not reimplemented)
  plus the name as visible text next to it, wrapped in a `flex items-center
  gap-2 text-sm text-muted-foreground` row (small/muted, matching the
  card's existing `hoursSaved` byline typography). When
  `attributedUserName` is `null`: renders `lucide-react`'s `UserRound` icon
  (`className="size-6 shrink-0"` — `size-6` matches `UserAvatar`'s `"sm"`
  variant's own `size-6 text-xs` container exactly, so the anonymous icon
  and the avatar occupy the same visual footprint in the byline row) plus
  the literal text "Anonymous" (judgment call — ticket left name-or-no-name
  as a judgment call for the anonymous case; "Anonymous" reads better than
  a bare icon with nothing next to it and keeps both branches visually
  parallel). `StoryCard` gained a new required `attributedUserName: string
  | null` prop, threaded from `StoryFeed`'s `feed.data.items.map(...)` (the
  field was already on `LikeFeedItemDto`/shared `LikeFeedItem` per ticket
  02, and `schema.d.ts` was already current — no regeneration needed).
- `apps/e2e/tests/story-feed-avatars.spec.ts` (new file): two specs against
  the real dockerized stack — (1) sign up with a fresh `crypto.randomUUID()`
  email + name "Hedy Lamarr", submit a story, assert the feed card contains
  the story text plus both the visible name text and (via `getByTitle`) the
  avatar's `title` attribute; (2) submit a story while logged out, assert
  the feed card shows "Anonymous" (`exact: true` — see gotcha below) and no
  attributed name. Followed `auth-flow.spec.ts`'s pattern exactly
  (`getByRole`/`getByLabel`, per-test random email, no `global-setup.ts`
  changes).
  - **Gotcha for future e2e authors:** the anonymous test's own random
    story-marker text (e.g. `anonymous-e2e-<timestamp>`) itself contains the
    substring "anonymous", so `card.getByText("Anonymous")` without `{
    exact: true }` hits a Playwright strict-mode violation (matches both the
    "Anonymous" byline span and the story paragraph, since Playwright's
    string `getByText` is a case-insensitive substring match by default).
    Fixed by passing `{ exact: true }`. Not a product bug, just an e2e
    authoring trap — flagging in case a review-round session adds more
    "anonymous"-flavored test data elsewhere.
- Ran `pnpm --filter @thanks-claude/web build` (typecheck + Next.js
  production build) — clean, no errors.
- Ran the **full** e2e suite (all 17 specs across all 8 spec files,
  including all of tickets 01–03's prior coverage), not just the new file —
  all 17 passed, confirming no regression from this ticket's changes.
  Docker stack was not already running before this session's test runs and
  was cleanly torn down after (`docker ps` empty afterward) — Playwright's
  own `webServer`/`global-setup.ts`/`global-teardown` handled bring-up/
  teardown, no manual `docker compose` intervention needed.

**No coding-rule conflicts newly introduced by this ticket** — see the
cross-ticket summary below for the one conflict already on record from
ticket 01 (still open, not something this ticket could resolve; it's a
backend/config-layer concern, out of scope for `apps/web`).

---

## Cross-ticket summary (for whichever session runs `review/round-1/tickets`)

All 4 tickets are now built. Full picture across the plan:

- **01 — Users + auth API foundation**: new `users` table (Drizzle
  migration `0001_lying_true_believers.sql`), bcrypt password hashing, JWT
  session in an httpOnly cookie, `POST /auth/signup`, `POST /auth/login`,
  `POST /auth/logout`, `GET /auth/me`, a globally-registered
  `CurrentUserGuard` (`APP_GUARD`) that populates `@CurrentUser() user:
  AuthUser | null` on any controller param without ever blocking a request.
  **Flag for review:** this ticket's own end-state noted a coding-rule
  conflict — the project has no `ConfigService`/Joi/Zod-validated config
  layer, so `JWT_SECRET`/`DATABASE_URL` are read directly via
  `process.env` at a couple of call sites rather than through a typed,
  validated config module. This is a pre-existing repo-wide pattern (not
  introduced by this plan), but auth secrets make it more sensitive than
  the prior code that read `process.env` — worth a explicit look in
  review to decide whether to fix now or route to `plans/tech-debt/`.
- **02 — Likes attribution (API)**: nullable `likes.user_id` FK (migration
  `0002_brainy_tusk.sql`), `LikesRepository.getStoryPage` now does an
  explicit-column `leftJoin(users, ...)` aliasing `users.name` as
  `attributedUserName`; shared `LikeFeedItem`/`LikeFeedItemDto` carry it,
  the plain `Like`/`LikeDto` (create response) deliberately does not. No
  raw `userId` ever exposed in any JSON response. 54/54 `apps/api` tests
  passing as of that ticket's session.
- **03 — Web: login/signup modal + header auth state**: `UserAvatar`
  shared component (`apps/web/components/user-avatar.tsx`), shadcn-style
  `Dialog` (`apps/web/components/ui/dialog.tsx`), `AuthModal`
  (self-contained trigger+dialog), `apps/web/lib/api-client/auth.ts`
  (`useMe`/`useSignup`/`useLogin`/`useLogout`), header wiring in
  `apps/web/app/page.tsx` (`HeaderAuthControl`). **Deviation/gotcha worth a
  review look:** that session used a scratchpad `rsync` snapshot + isolated
  build to generate a first-pass `schema.d.ts` while ticket 02 was still
  concurrently WIP-broken, then re-derived the final, real `schema.d.ts`
  from the actual `apps/api/openapi.json` once ticket 02 finished and
  confirmed the two were identical in shape — the scratch copy was never
  committed or referenced; only the real-pipeline output landed in the
  repo. Worth a spot-check in review that `apps/web/lib/api-client/
  schema.d.ts` in the final diff is indeed the real-pipeline version (it
  should be — this ticket's session used it as-is without regenerating,
  and it matched the live API's shape throughout).
- **04 — Web: story-feed avatars** (this session): see above.

**Local-environment gotcha flagged across tickets 02/04 (not a code bug,
purely local Docker/tsc caching):** if `pnpm --filter @thanks-claude/api
generate:openapi` (or a plain `nest build`) ever silently produces an
empty/missing `apps/api/dist/` with exit code 0, delete
`apps/api/tsconfig.build.tsbuildinfo` first — a stale incremental-build
cache file tricks `tsc --build` into skipping emit even when `dist/`
doesn't exist. It's gitignored so won't show up in `git status`; nothing
for review to fix, just a note in case it resurfaces.

**Nothing else outstanding** — no other deviations from the spec/ADR
across tickets 01–04 that this session is aware of. The one open item for
review-decide to weigh in on is the `ConfigService`/Joi/Zod config-layer
gap from ticket 01, above.

---

## Previous session end-state (ticket 03)
Ticket 03 complete (2026-07-25): login/signup modal + header auth state
built on the frontend (`apps/web` only). Ran concurrently with ticket 02's
session (a separate backend ticket touching `apps/api/` only); by the time
this session finished, PROGRESS.md already showed ticket 02 complete, so
this session advanced current phase/ticket straight to
`implement/04-story-feed-avatars` (no other ticket left in between).

**What was built (all new files, all in `apps/web`, exact paths/exports
ticket 04 needs):**
- `apps/web/components/ui/dialog.tsx` — shadcn-style Dialog composition on
  top of `radix-ui`'s unified package (`import { Dialog as DialogPrimitive }
  from "radix-ui"`, i.e. `Dialog.Root`/`.Trigger`/`.Portal`/`.Overlay`/
  `.Content`/`.Title`/`.Close` — same unified-package pattern
  `button.tsx` already uses for `Slot`). Exports: `Dialog`, `DialogTrigger`,
  `DialogPortal`, `DialogClose`, `DialogOverlay`, `DialogContent`,
  `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`. Styled
  with `bg-card`/`border-border`/`rounded-lg` to match `button.tsx`/
  `input.tsx`; uses `tw-animate-css`'s `animate-in`/`fade-in-0`/`zoom-in-95`
  utilities (already a dependency, already imported in `globals.css`) for
  open/close transitions; includes a close (`X` from `lucide-react`) button
  by default (`showCloseButton` prop, defaults `true`).
- **`apps/web/components/user-avatar.tsx`** — exports `UserAvatar` (named
  export) and `UserAvatarSize` (`"sm" | "md" | "lg"`). Props: `{ name:
  string; size?: UserAvatarSize; className?: string }`, default size `"md"`.
  Derives initials as first letter of the first word + first letter of the
  last word of `name` (single-word names get one letter). Renders a
  `bg-primary`/`text-primary-foreground` rounded-full `span`,
  `aria-hidden="true"` (decorative; a `title={name}` attribute gives a
  hover tooltip) since it's always meant to be used alongside visible name
  text or in a context where the name is otherwise available (header has no
  adjacent name text by design — see spec — so there the avatar is purely a
  "you're logged in" visual, not the only place the name is exposed).
  **Ticket 04: import as `import { UserAvatar } from
  "@/components/user-avatar"` and pass the feed item's
  `attributedUserName` as `name` — this is the exact shared component the
  spec requires be visually consistent between header and story feed.**
- `apps/web/lib/api-client/auth.ts` — mirrors `likes.ts`'s
  openapi-fetch + TanStack Query pattern exactly. Exports `meQueryKey`
  (`["auth", "me"] as const`), `useMe()` (query, returns `AuthUser | null`
  from `GET /auth/me`'s `{ user }` shape), `useSignup()`/`useLogin()`
  (mutations, `useMutation<AuthUserDto, unknown, SignupBody|LoginBody>` —
  `unknown` error type deliberately, since on failure they `throw error`
  raw (the parsed JSON error body from `openapi-fetch`, e.g. `{statusCode,
  message, error}`) rather than wrapping in `new Error(...)`, so the modal
  can read the server's actual `message` for inline display; both call
  `queryClient.setQueryData(meQueryKey, user)` on success so the header
  updates without waiting on a refetch), `useLogout()` (mutation, clears
  the me-query cache to `null` and invalidates it on success).
- `apps/web/components/auth-modal.tsx` — exports `AuthModal` (default-ish
  single named export, no props). Self-contained: owns its own `open`
  (Dialog open state) and `mode` (`"login" | "signup"`) state, renders its
  own `DialogTrigger` (`<Button variant="outline" size="sm">Login</Button>`)
  — so mounting `<AuthModal />` anywhere renders the "Login" trigger and
  the modal together; there is no separate open-state prop for a caller to
  wire up. Two internal (unexported) sub-components, `LoginForm`/
  `SignupForm`, each its own `react-hook-form` + `zodResolver` instance
  (kept separate rather than one shared schema/form, since the field sets
  differ and only one is ever mounted at a time via the mode toggle) using
  the shared `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/
  `FormMessage`/`Input` components, mirroring `page.tsx`'s story-share form
  pattern exactly. Client validation via zod: login — `email` (`.email()`),
  `password` (non-empty); signup — `name` (non-empty), `email`
  (`.email()`), `password` (`.min(6, "Password must be at least 6
  characters")`). Server error surfaced as `<p role="alert"
  className="text-sm text-destructive">` reading the mutation's raw error
  `.message` (falls back to a generic message if the shape is unexpected)
  — matches `page.tsx`'s existing `likeSubmit.isError`/`storySubmit.isError`
  block style exactly. On mutation success, calls the `onSuccess` prop
  (from `AuthModal`, which closes the dialog) — mode resets to `"login"`
  each time the modal is reopened.
- `apps/web/app/page.tsx`: new `HeaderAuthControl()` function component
  added right after `renderLikeCount`; calls `useMe()`/`useLogout()`.
  Renders nothing (`null`) while `me` is loading/undefined (avoids a
  "Login" flash before the me-query resolves); renders `<AuthModal />` when
  `me.data === null`; renders `<UserAvatar name={me.data.name} size="sm"
  />` + a `variant="ghost" size="sm"` "Log out" button (calling
  `logout.mutate()`) when logged in. Wired into the hero card's header row
  via a new `<div className="ml-auto"><HeaderAuthControl /></div>` right
  after the `<h1>` — `ml-auto` pushes it to the right of the existing three
  dots + title without changing their layout (the row was already `flex
  items-center gap-2`, so this was a one-line addition, no restructuring).
- `apps/web/lib/api-client/client.ts`: added `credentials: "same-origin"`
  explicitly to the `createClient` call, with a comment explaining why.
  **Investigated per the ticket's ask, concluded no *required* change**:
  `apiClient`'s `baseUrl` is the relative path `"/api"` (not read from an
  env var, not absolute), so every request this client makes is inherently
  same-origin by construction — in Docker/prod, `apps/web/nginx.conf`
  proxies `/api/` to the `api` service on the *same* origin (port 8080)
  the static site is served from; there's no separate dev-server proxy
  setup in this repo (`next.config.js` has no `rewrites`, and `next dev`
  isn't wired to proxy `/api` anywhere — running `next dev` standalone
  against a separately-running API was already not a supported flow before
  this ticket, unrelated to auth). Modern browsers' fetch default
  (`credentials: "same-origin"`) already sends cookies on same-origin
  requests, so the httpOnly session cookie would have worked without this
  change — added the explicit option anyway since it's exactly the
  assumption the whole auth mechanism depends on and costs nothing to make
  non-implicit; verified live via e2e against the real dockerized
  nginx+api+web stack (see Tests below), not just by reading the config.
- `apps/web/lib/api-client/schema.d.ts` regenerated for real (`pnpm
  --filter @thanks-claude/web generate:api-types`, reading the *actual*
  `apps/api/openapi.json` after ticket 02 finished and had already
  regenerated it) — picked up `/auth/signup|login|logout|me` plus ticket
  02's `LikeFeedItemDto.attributedUserName`/`LikesPageDto`. Ticket 04 should
  not need to regenerate this again unless the API changes further, but
  double-check it's current before relying on it.

**Deviation/process note (not a scope deviation, a build-tooling one):**
early in this session, before ticket 02 had finished, `pnpm --filter
@thanks-claude/api generate:openapi` against the *live* `apps/api` was
transiently broken (ticket 02's own WIP — a test file not yet matching a
schema change it had just made) and its `dist/` was also being actively
written by ticket 02's own concurrent build, so building the real
`apps/api` in place wasn't reliable or safe to attempt while ticket 02 was
still running. To get correctly-typed auth endpoints into
`apps/web/lib/api-client/schema.d.ts` without touching the live `apps/api`
or racing its `dist/`, this session took an `rsync` snapshot of the repo
into the scratchpad, built **that isolated copy** (hit the exact stale
`tsconfig.build.tsbuildinfo` issue the `node-typescript-docker.md` coding
rule warns about — same fix, delete the file), and used its
`openapi.json` output to generate a first-pass `schema.d.ts`. Once ticket
02 finished for real, this session re-ran the real, safe commands (`pnpm
--filter @thanks-claude/web generate:api-types` reading the now-final,
real `apps/api/openapi.json`) and confirmed the result was identical in
shape to the scratch-derived version — so the final `schema.d.ts` in the
repo came from the real pipeline, not the scratch workaround; the scratch
copy was scaffolding only, never committed/referenced by anything in the
repo.

**Coding-rule note:** the "UI verification" general rule (verify
frontend changes with Playwright, not claude-in-chrome) was followed for
real, not skipped — see Tests below; this required running the actual
`docker compose up --build` stack (api + web + postgres), which was only
attempted after confirming ticket 02 was no longer concurrently running
(checked `docker ps` showed only a standalone `postgres` container up
front, and PROGRESS.md/this session's own build attempts confirmed
`apps/api` was in a clean, committable-looking state by then) — this
session deliberately avoided touching or building the live `apps/api`
while ticket 02 might still have been active, per the coordinating
instructions, and only used the isolated scratch copy for that period.

**Tests:** No component-level unit test setup exists anywhere in
`apps/web` (checked for `.spec.tsx`/`.test.tsx` — none), consistent with
the spec's testing decisions (Playwright e2e is this repo's frontend
testing seam). Added `apps/e2e/tests/auth-flow.spec.ts` — six specs, all
passing against the real dockerized stack (`docker compose up --build`,
via the existing Playwright config/global-setup, no changes needed there):
signup through the modal flips the header to avatar + "Log out"; a
sub-6-character signup password is rejected client-side with the exact
message; log in with an existing account after logging out, then logging
back in via the "Log in" tab; wrong-password login shows "Invalid email or
password" (the API's shared generic message); signing up twice with the
same email shows "Email already in use" (409, surfaced verbatim); a
logged-in session survives `page.reload()`. Each test uses a fresh
`crypto.randomUUID()`-based email per run since `global-setup.ts` only
truncates the `likes` table between runs, not `users` — deliberately did
not touch `global-setup.ts` to add a `users` truncation, to keep this
session's footprint to `apps/web`/`apps/e2e` only and not risk affecting
ticket 02's or any other ticket's test data assumptions; flagging in case a
future session wants a cleaner reset. Ran the *full* existing e2e suite
after adding these (not just the new file) — all 14 specs passed, so
nothing regressed.

**No coding-rule conflicts to flag** beyond the tooling one already noted
above (which isn't a rule conflict, just a workaround for a concurrent-work
timing issue).

**What ticket 04 (story-feed avatars) needs to know:**
- Import the shared avatar component as `import { UserAvatar } from
  "@/components/user-avatar"`; it takes `{ name, size?, className? }` —
  pass the feed item's `attributedUserName` (from ticket 02) as `name` when
  non-null, and render a `lucide-react` anonymous icon (per spec) when it's
  `null` instead of rendering `UserAvatar` at all.
- `apps/web/lib/api-client/schema.d.ts` is already regenerated and current
  as of this session (includes `LikeFeedItemDto.attributedUserName`) — spot
  check it's still current before relying on it, but no action should be
  needed.
- The e2e testing seam is proven working end-to-end in this session
  (`docker compose up --build` via Playwright's existing config) — reuse
  the same pattern (`apps/e2e/tests/*.spec.ts`, `getByRole`/`getByLabel`
  queries) for the feed-avatar specs the spec's testing decisions call for.

## Previous session end-state (ticket 02)
Ticket 02 complete (2026-07-25): likes attribution API built and fully
tested (54/54 `apps/api` tests pass, typecheck clean). Ran concurrently
with ticket 03's session (a separate frontend ticket touching `apps/web/`
only) — this session touched only `apps/api/`, `packages/shared-types/`,
and the migration files, so there should be no conflicts.

**What was built:**
- `apps/api/src/db/schema.ts`: added a nullable `userId` (`user_id`)
  column to the `likes` table, `references(() => users.id)` (no
  `.notNull()`, no unique constraint). Reordered `users` above `likes` in
  the file purely for readability (FK target defined first); no behavior
  change. Migration generated for real via `drizzle-kit generate` against
  the already-running `postgres` container (`docker ps` showed it up, no
  need to start it) — **not** hand-written:
  `apps/api/drizzle/0002_brainy_tusk.sql` (two statements: add column, add
  FK constraint) + matching `meta/0002_snapshot.json`/`_journal.json`
  entry. Applied and verified with `drizzle-kit migrate`.
- `apps/api/src/apps/likes/likes.controller.ts`: `create()` now takes
  `@CurrentUser() user: AuthUser | null` alongside the existing
  `@Body() dto`, forwarded to the service.
- `apps/api/src/apps/likes/likes.service.ts`: `create(dto, currentUser)`
  passes `userId: currentUser?.id` (i.e. `undefined` when anonymous) to
  `LikesRepository.insertLike`. The create response is now built as an
  explicit object literal (`{ id, createdAt, story, hoursSaved }`) instead
  of spreading the raw repository row — this deliberately keeps the raw
  `userId` column off the create endpoint's JSON response (it was never
  asked for there; only the feed needs the attribution surfaced, and only
  as a display name, never the raw id). `getPage` maps each row to include
  `attributedUserName` from the repository's joined result.
- `apps/api/src/apps/likes/likes.repository.ts`: `NewLikeValues` gained an
  optional `userId?: string`; `getStoryPage` now does an explicit-column
  `select({...}).leftJoin(users, eq(likes.userId, users.id))` (not
  `select()` of everything) so it can alias `users.name` as
  `attributedUserName` directly at the query level — new `LikeFeedRow`
  type describes that shape. `insertLike`/`countAll`/`getStatsAggregate`/
  `countWithStory` untouched — count/stats deliberately do not carry
  attribution, matching the ticket's scope.
- Shared types (`packages/shared-types/src/index.ts`): added
  `LikeFeedItem = Like & { attributedUserName: string | null }` and
  changed `LikesPage.items` to `LikeFeedItem[]`. Deliberately did **not**
  add the field to the base `Like` type itself, since `Like`/`LikeDto` is
  also the create-endpoint's response type and the ticket only asked for
  the feed/page response to carry it — see the DTO note below for how this
  is threaded through on the API side. Rebuilt the package afterward
  (`pnpm --filter @thanks-claude/shared-types build`).
- DTOs: added `LikeFeedItemDto extends LikeDto implements LikeFeedItem` in
  `apps/api/src/apps/likes/dto/like.dto.ts` (adds the
  `attributedUserName` `@ApiProperty`); `LikesPageDto.items` in
  `dto/likes-page.dto.ts` retyped to `LikeFeedItemDto[]`. `LikeDto` itself
  (used by the plain `POST /likes` create response) is unchanged.
- Regenerated `apps/api/openapi.json` (`pnpm --filter @thanks-claude/api
  generate:openapi`) so `LikeFeedItemDto`/`LikesPageDto` reflect the new
  field for whichever session next regenerates `apps/web`'s API client
  types from it.

**Deviation/gotcha worth flagging:** `pnpm --filter @thanks-claude/api
generate:openapi` (`nest build && node dist/generate-openapi.js`) silently
produced *zero* files in `dist/` the first time (exit code 0, no error) —
root cause was a stale `apps/api/tsconfig.build.tsbuildinfo` left over
from a previous build, tricking `tsc --build`'s incremental cache into
believing `dist/` was already up to date even though the directory didn't
exist. Deleting that file (`rm apps/api/tsconfig.build.tsbuildinfo`) before
`nest build` fixed it. `tsconfig.build.tsbuildinfo` is gitignored (root
`.gitignore` has `*.tsbuildinfo`) so this won't show up in `git status`,
but if `generate:openapi` (or plain `nest build`) ever silently produces an
empty/missing `dist/` again locally, delete that file first before
assuming something is actually broken. Not something to fix in this
ticket — just a note for whoever hits it next.

**Tests:** extended `likes.repository.spec.ts` (asserts the
`leftJoin(users, ...)` call and the explicit column-select shape,
including a case where `attributedUserName` comes back populated),
`likes.service.spec.ts` (new cases: `userId` forwarded to the repository
when a current user is present vs. `undefined` when not, and an explicit
assertion that the create response never carries a raw `userId` field),
and `likes.spec.ts` (added a `describe("attribution")` block with two
full-stack cases: signing up, then posting a like/story with the session
cookie attached — asserts the create response has no `userId` field and
that the subsequent `GET /likes` feed shows `attributedUserName` equal to
the signed-up user's name; and the same round-trip with no cookie at all,
asserting `attributedUserName` is `null` on that feed item). Had to add
`app.use(cookieParser())` to `likes.spec.ts`'s test app bootstrap (it
didn't have it before — `auth.spec.ts` already did) since
`CurrentUserGuard` reads `request.cookies`, which is `undefined` without
the `cookie-parser` middleware wired in, and would have silently made the
attribution test always resolve to "no session" regardless of the cookie
header sent.

**No coding-rule conflicts beyond the one already flagged in ticket 01's
end-state** (no project-wide Joi/Zod config layer / direct `process.env`
access outside a config layer) — this ticket didn't touch env vars at all.

**What ticket 04 (story-feed avatars) needs to know:**
- `GET /likes` feed items now carry `attributedUserName: string | null`
  (via `LikeFeedItemDto`/shared `LikeFeedItem` type) — `null` means
  anonymous/unattributed, render the `lucide-react` anonymous icon per the
  spec; a non-null value is the display name to build the initials avatar
  from. No raw user id is ever exposed on this or any other likes
  endpoint.
- `POST /likes`'s response (`LikeDto`) intentionally does **not** carry
  `attributedUserName` — it only appears on `GET /likes` (`LikesPageDto`
  items). If ticket 04 (or 03) needs the current user's name right after
  creating a like/story, it already has that in the frontend's own current
  logged-in-user state (ticket 03's session), not from the create
  response.
- `apps/web/lib/api-client/schema.d.ts` will need regenerating from the
  now-updated `apps/api/openapi.json` to pick up
  `attributedUserName`/`LikeFeedItemDto` — not done as part of this
  session per instructions (frontend untouched here); whatever session
  wires up the avatars should regenerate it first.

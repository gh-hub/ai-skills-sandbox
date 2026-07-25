# Context: user-accounts-auth

## What we're building
Basic user accounts with login/signup, likes/reviews attributed to logged-in
users, and initials avatars on the story feed.

## Key decisions
- New minimal `users` table (id, name, email, password_hash, created_at) —
  new module under `apps/api/src/apps/`. See `grill/ADR-001.md`.
- Signup + login combined into one modal (tabs/toggle), not separate flows.
- Password minimum 6 characters, no other complexity rules, via
  `class-validator` on the signup DTO.
- bcrypt for password hashing (not argon2). See `grill/ADR-001.md`.
- JWT session in an httpOnly, secure-in-production, sameSite cookie (never in
  response body or localStorage), plus a `GET /auth/me`-style endpoint so the
  frontend can restore login state on reload. See `grill/ADR-001.md`.
- `likes.user_id` — new nullable FK to `users.id`, no uniqueness/dedup
  constraint; anonymous submission unchanged. See `grill/ADR-001.md`.
- Story feed shows an initials avatar + name for attributed stories, a
  `lucide-react` anonymous icon otherwise; requires a join in the likes
  repository plus new fields on shared `Like`/`LikesPage` types and
  `LikeDto`/`LikesPageDto`.
- Login control sits in the hero card's existing header row (top-right), not
  a new nav bar.
- Logged-in state replaces "Login" with an avatar + plain "Log out" button in
  that same spot (not a "Hi {name}" greeting).
- Out of scope: password reset, email verification, rate limiting/lockout,
  OAuth/social login, profile editing.

## Spec
See `spec.md` for the full synthesized spec (implementation decisions,
testing decisions, out of scope, open questions).

## Tickets
- 01 — `01-users-auth-foundation` — Users + auth API foundation (blocked by: none)
- 02 — `02-likes-attribution-api` — Likes attribution (API) (blocked by: 01)
- 03 — `03-auth-modal-header` — Web: login/signup modal + header auth state (blocked by: 01)
- 04 — `04-story-feed-avatars` — Web: story-feed avatars (blocked by: 02, 03)

## Current state
Phase: review/round-1/decide
Completed tickets: 01-users-auth-foundation, 02-likes-attribution-api,
03-auth-modal-header, 04-story-feed-avatars
Current ticket: none

Plan complete (2026-07-25). User decision recorded: "done". All 8 open
DEBT findings from round 1 exported to `plans/tech-debt/`.

## Round 1 review findings (summary)
0 BLOCK findings, 8 DEBT findings. No tickets written. Full detail in
`review/round-1/report.md`; DEBT items also logged to `review/tech-debt.md`.

## Load this session
All 4 original tickets are implemented; this is now a review-tickets
session (`review/round-1/tickets`). Load:
- `plans/20260725_154735-user-accounts-auth/spec.md` — the full synthesized
  spec (implementation decisions, testing decisions, out of scope, open
  questions) to review the implementation against.
- All four ticket files for their acceptance criteria:
  `plans/20260725_154735-user-accounts-auth/tickets/01-users-auth-foundation.md`,
  `02-likes-attribution-api.md`, `03-auth-modal-header.md`,
  `04-story-feed-avatars.md` (all in the same `tickets/` folder).
- The full diff on this branch (`git diff main...HEAD` or equivalent) —
  spans `apps/api` (users/auth module, likes attribution), `packages/
  shared-types`, and `apps/web`/`apps/e2e` (auth modal, header state, story
  feed avatars).
- `plans/20260725_154735-user-accounts-auth/PROGRESS.md`'s "Cross-ticket
  summary" section (written at the end of ticket 04's session) — flags the
  one known open item (ticket 01's `ConfigService`/Joi/Zod config-layer
  gap) and a couple of process notes worth a sanity-check, not necessarily
  code problems.
- `grill/ADR-001.md` if a review question needs the original architecture
  rationale (bcrypt vs. argon2, JWT cookie vs. other session strategies,
  nullable `likes.user_id` with no dedup constraint).

## Gotchas
- The shared "current user or none" mechanism from ticket 01 is ready to
  consume: import `{ CurrentUser }` from
  `apps/api/src/apps/auth/current-user.decorator.ts` and the `AuthUser`
  type (`{ id, name, email }`) from `@thanks-claude/shared-types`. Use
  `@CurrentUser() user: AuthUser | null` as a controller param — it's
  populated by a globally-registered guard (`CurrentUserGuard`, wired via
  `APP_GUARD` inside `auth.module.ts`) that never blocks a request and
  never throws; a missing/invalid/expired cookie always resolves to
  `null`. No need to touch cookies or JWTs directly in the likes module.
- Running the API (including any manual/local testing) now requires
  **both** `DATABASE_URL` and `JWT_SECRET` env vars set, or the app throws
  at startup. Integration test files that import `AppModule` must set both
  in `beforeAll` before importing it (see `likes.spec.ts`/`auth.spec.ts` for
  the pattern: `process.env.JWT_SECRET = "test-jwt-secret";` next to the
  `DATABASE_URL` line).
- `users` table + migration `apps/api/drizzle/0001_lying_true_believers.sql`
  already exist (generated via real `drizzle-kit generate`, not
  hand-written) — build `likes.user_id` as a nullable FK on top of it,
  don't recreate the users table.
- No `.env.example` exists in this repo — nothing to update there when
  adding new env vars, just document them in the plan files as they're
  introduced (already done for `JWT_SECRET` here and in `docker-compose.yml`).
- Avatar styling must match the story-feed review byline avatar (used in two
  places: story feed and logged-in header state) — keep them visually
  consistent. (Applies to tickets 03/04, not 02.)
- Do not touch `apps/web/components/spark-mark.tsx` — already replaced with a
  traced SVG in a separate, completed task this session.
- (From ticket 02) `GET /likes` feed items now carry
  `attributedUserName: string | null` (shared `LikeFeedItem` type,
  `LikeFeedItemDto` on the API side) — `null` means anonymous, render the
  `lucide-react` icon; non-null is the display name for the initials
  avatar. The plain `Like`/`LikeDto` type (used by `POST /likes`'s
  response) deliberately does **not** carry this field — only the feed
  needs it. No raw user id is exposed on any likes endpoint.
- (From ticket 02) If `pnpm --filter @thanks-claude/api generate:openapi`
  (or a plain `nest build`) ever silently produces an empty/missing
  `apps/api/dist/` with exit code 0, delete
  `apps/api/tsconfig.build.tsbuildinfo` first — a stale one tricks `tsc`'s
  incremental cache into skipping emit even when `dist/` doesn't exist.
  Gitignored, so it won't show up in `git status`; this is a purely local
  environment gotcha, not a code bug.
- (From ticket 02) Any NestJS integration test file that boots a real
  `INestApplication` and needs `CurrentUserGuard` to actually read a
  session cookie (not just always resolve to `null`) must call
  `app.use(cookieParser())` on that test's own app instance — it isn't
  inherited from `main.ts`. `likes.spec.ts` needed this added; `auth.spec.ts`
  already had it.
- (From ticket 03) The shared initials-avatar component is
  `apps/web/components/user-avatar.tsx`, named export `UserAvatar`, props
  `{ name: string; size?: "sm" | "md" | "lg"; className?: string }` (default
  size `"md"`). It's `aria-hidden` (decorative) and renders only initials —
  ticket 04 renders the visible name as separate text alongside it on the
  story feed (per spec), same as the header does with its own adjacent
  context. Use `size="sm"` to match the header's usage if visual
  consistency with the header avatar matters (it does, per the spec/ADR).
- (From ticket 03) `apps/web/components/ui/dialog.tsx` (shadcn-style Dialog
  on `radix-ui`'s unified `Dialog` export) and
  `apps/web/components/auth-modal.tsx` (`AuthModal`, self-contained
  trigger+modal) exist now if any future ticket needs a dialog — ticket 04
  shouldn't need either, just flagging they're no longer "doesn't exist
  yet."
- (From ticket 03) `apps/web/lib/api-client/client.ts`'s `apiClient` now
  sets `credentials: "same-origin"` explicitly (previously relied on the
  browser fetch default, which happened to already be `"same-origin"` for
  this app's always-relative `baseUrl: "/api"`). No action needed from
  ticket 04, just noting the file changed.
- (From ticket 03) `apps/e2e/tests/auth-flow.spec.ts` exists (6 specs,
  signup/login/logout/reload/validation/conflict-error, all passing against
  the real `docker compose up --build` stack) — reuse its `getByRole`/
  `getByLabel` query style for ticket 04's feed-avatar e2e specs. Note:
  `apps/e2e/global-setup.ts` only truncates the `likes` table between test
  runs, not `users` — `auth-flow.spec.ts` works around this with a fresh
  `crypto.randomUUID()` email per test; do the same for any new signup-based
  setup in ticket 04's specs rather than assuming a clean `users` table.
- (From ticket 04, now complete) `apps/web/components/story-feed.tsx`'s
  `StoryCard` renders a new `StoryByline` row above the story text: the
  shared `UserAvatar` (`size="sm"`) + visible name when
  `attributedUserName` is non-null, or `lucide-react`'s `UserRound` icon
  (`className="size-6 shrink-0"`, matching `UserAvatar`'s `"sm"` footprint)
  + the literal text "Anonymous" when it's `null`. `StoryCard` gained a
  required `attributedUserName: string | null` prop.
- (From ticket 04) e2e authoring trap for review to be aware of: a test's
  own random story-marker text containing the substring "anonymous" (e.g.
  `anonymous-e2e-<timestamp>`) will strict-mode-violate a plain
  `getByText("Anonymous")` locator (Playwright's string matcher is
  case-insensitive substring by default) — `apps/e2e/tests/
  story-feed-avatars.spec.ts` uses `{ exact: true }` to disambiguate from
  the "Anonymous" byline span. Worth the same care if review adds more
  "anonymous"-themed test data.
- (From ticket 04) The full e2e suite (17 specs across 8 files, all of
  tickets 01–04's coverage) was run once at the end and passed in full —
  no regressions from ticket 04's changes. `pnpm --filter @thanks-claude/web
  build` also ran clean (typecheck + production build).
- (From ticket 04 / cross-ticket) One open item flagged for
  `review/round-1/tickets` to weigh in on: ticket 01's coding-rule conflict
  (no project-wide `ConfigService`/Joi/Zod-validated config layer;
  `JWT_SECRET`/`DATABASE_URL` read via direct `process.env` access) — see
  `PROGRESS.md`'s "Cross-ticket summary" section for full detail. Not
  something ticket 04 touched or could resolve (backend/config concern,
  ticket 04 is `apps/web`/`apps/e2e` only).

# Context: claude-awards

## What we're building
Let users attach awards like 🐛 Bug Slayer to their thanks-to-Claude-Code stories,
and browse all awards with give-counts.

## Key decisions
- `awards` table: required `title`/`description`, optional `icon` (UI falls back to
  a default icon when blank).
- Full REST CRUD (`GET`/`GET :id`/`POST`/`PATCH`/`DELETE`) on `apps/api/.../awards`,
  mirroring the `likes` module structure, even though the UI only wires up list +
  create for now.
- Exactly 7 awards pre-seeded via a Drizzle migration (Bug Slayer, Speed Demon,
  Clean Code, Lifesaver, Creative Genius, Patient Teacher, Refactor Royalty).
- Many-to-many join table between `likes` and `awards`: a thanks story can have
  zero, one, or many awards attached.
- Award picker (multi-select, fully optional) added only to the "Share a story"
  form, not the quick one-click Like button.
- Single combined `/awards` page: lists all awards + give-counts, and shows a
  create-award form to logged-in users only (anonymous users get a login prompt via
  the existing login/signup modal instead).
- `POST /awards` requires login; `GET`/`PATCH`/`DELETE` on `/awards` stay open,
  matching the existing `likes` endpoints.
- Deleting an award cascades to remove it from any thanks story it was attached to
  (join table cleanup only) — the thanks story itself is untouched.
- See `grill/decisions.md` for full rationale on every decision, and
  `grill/ADR-001.md` for the detailed schema/API shape (new `awards` table, new
  join table, cascade behavior, auth split).
- See `spec.md` for the finalized technical spec: schema, endpoints, the new
  mandatory-auth guard, and frontend/component plan.

## Tickets
- `01-schema-seed-data` — `awards` and `like_awards` tables plus seed migration for the 7 awards
- `02-awards-crud-module` — full REST CRUD for awards, including the new mandatory-auth guard on POST
- `03-attach-awards-to-likes` — `POST /likes` accepts `awardIds`, feed/create responses include attached awards
- `04-awards-page-frontend` — `/awards` page (list + give-counts + create form for logged-in users)
- `05-story-picker-feed-badges` — award picker on the story form and award badges on feed cards

## Current state
Plan complete (2026-07-31) — round-3 was the final review; resolution:
spec.md amended to document the e2e Docker isolation infra (see
`review/round-3/findings.md`).
Completed tickets: `01-schema-seed-data`, `02-awards-crud-module`,
`03-attach-awards-to-likes`, `04-awards-page-frontend`,
`05-story-picker-feed-badges`
Review round-1: FAIL — see `review/round-1/findings.md`.
Review round-2: FAIL — see `review/round-2/findings.md`.
Review round-3: PASS — see `review/round-3/findings.md`.
Completed fix tickets:
- `review/round-1/tickets/01-award-delete-cascade-http-test.md` (2026-07-31)
  — added the missing HTTP-level DELETE-cascade test to `awards.spec.ts`; no
  production code changed, cascade already worked at the DB level.
- `review/round-2/tickets/01-e2e-global-setup-truncate-cascade.md`
  (2026-07-31) — one-line fix in `apps/e2e/global-setup.ts`'s
  `truncateLikesTable()`: `"TRUNCATE TABLE likes;"` →
  `"TRUNCATE TABLE likes CASCADE;"`. Verified with a full e2e run (22/22
  passed, including `awards-page.spec.ts` and `story-award-picker.spec.ts`)
  and a re-run of `pnpm --filter api test` (10 suites/102 tests, unaffected).
Round-3 had no fix ticket: its one finding (unrequested-but-legitimate e2e
Docker isolation infra, not covered by spec.md) was resolved by the user
accepting the infra as in-scope and having `spec.md` amended to document it,
rather than reverting it.
Current ticket: (none)

## Load this session
- Both review-round fix tickets are done; there is no open ticket. This
  session should run `review/round-3` as a full review from scratch: a
  complete spec-match check against `spec.md` (all requirements, not just a
  recheck of the two prior gaps) plus the full gate — lint (N/A, no dedicated
  script/config), build (`pnpm --filter api build`, `pnpm --filter web
  build`), unit/integration (`pnpm --filter api test`), and e2e
  (`pnpm exec playwright test` from `apps/e2e`, expect 22/22 including
  `awards-page.spec.ts` and `story-award-picker.spec.ts`).
- Important: round-3 is beyond this plan's standard 2 auto-fix rounds. Per
  SKILL.md, if round-3 finds any gate/spec failure, do NOT auto-loop back to
  `implement` with a new fix ticket the way rounds 1 and 2 did — stop and run
  a live continue/stop checkpoint with the user first.
- Watch for the same local port-8080 conflict during the e2e gate step (see
  Gotchas below for the temporary-port workaround; revert both files
  immediately after, confirm clean via `git status`).

## Gotchas
- The feature is user-facing as "thanks" but internally named `likes` (table,
  module, hooks) — follow that existing naming convention for new code; don't
  introduce a `thanks` name.
- No admin/role system exists anywhere in this codebase — don't invent one. The
  only auth distinction needed is "logged in or not," for `POST /awards` only.
- The mandatory-auth guard now exists: `apps/api/src/apps/auth/require-auth.guard.ts`
  (`RequireAuthGuard`). It has no constructor dependencies — it just reads
  `request.user` (populated by the existing global, non-blocking
  `CurrentUserGuard`, which always runs first as an `APP_GUARD`) and throws
  `UnauthorizedException` if it's null/undefined, otherwise returns `true`. It is
  applied only via `@UseGuards(RequireAuthGuard)` at the method level on
  `AwardsController.create` — nothing else in the codebase requires login.
  Ticket 03 (`POST /likes` accepting `awardIds`) does NOT need this guard per the
  spec (likes stay anonymous-friendly) — only noted here so reviewers/future
  tickets don't assume it's global or that `CurrentUserGuard` itself became
  blocking.
- `drizzle-kit generate` only emits DDL from schema.ts diffs — it does not seed
  data. Any future seed migration needs the `INSERT` statements hand-appended to
  the generated `.sql` file (see `apps/api/drizzle/0003_nice_sir_ram.sql` for the
  pattern used in ticket 01).
- The new `like_awards` table has an FK to `likes`, so any test/fixture code doing
  a plain `TRUNCATE TABLE likes` must now use `TRUNCATE TABLE likes CASCADE`
  (already fixed in `likes.spec.ts`'s `GET /likes/stats` block) — watch for this
  if ticket 03 adds more truncate-based test fixtures.
  **Update (round-2 review):** `apps/e2e/global-setup.ts`'s `truncateLikesTable()`
  had the same plain-truncate bug and was missed until it broke the entire e2e
  gate (see `review/round-2/findings.md` and fix ticket
  `review/round-2/tickets/01-e2e-global-setup-truncate-cascade.md`).
  **Closed (round-2 fix, 2026-07-31):** `global-setup.ts` now truncates with
  `CASCADE` too, and the full e2e suite (22/22) plus `pnpm --filter api test`
  (10 suites/102 tests) both pass. This gotcha is now believed fully closed
  across all known locations. Swept the whole repo
  (`grep -rn "TRUNCATE TABLE likes" apps/`) as part of this fix: exactly two
  occurrences exist, `likes.spec.ts:331` and `global-setup.ts:27`, both now
  `CASCADE`. This gotcha is fully closed — no third location exists.
- Integration/e2e-style Postgres tests in this repo use `@testcontainers/postgresql`
  + `drizzle-orm/node-postgres/migrator` to spin up a real Postgres 16 container
  and run the actual migration files — see `apps/api/src/apps/likes/likes.spec.ts`,
  `apps/api/src/apps/awards/awards.spec.ts`, and `apps/api/src/db/schema.spec.ts`
  for the pattern (requires Docker available in the environment running the tests).
- `awards.repository.ts` computes `givenCount` with
  `leftJoin(likeAwards, eq(likeAwards.awardId, awards.id)) + count(likeAwards.id)
  + groupBy(awards.id)` — the same join shape (from the `likeAwards` side) is
  probably reusable/adaptable for ticket 03's "look up awards attached to a like"
  query.
- `GET/PATCH/DELETE /awards/:id` use `ParseUUIDPipe` on the `:id` param and throw
  `NotFoundException` (404) for a valid-but-missing id — this was an addition
  beyond the ticket 02 acceptance criteria (noted in that ticket file), done for
  consistency with "handle errors at user-input boundaries," not because the spec
  demanded it. Flag if a later review wants it reverted for being unrequested.
- The exact shape ticket 04/05 will see on every `Like`/`LikeFeedItem` (from
  `GET /likes`, `GET /likes?...`, and the `POST /likes` create response) is now:
  `awards: { id: string; title: string; icon: string | null }[]` — always an
  array (never omitted/null), empty `[]` when no awards are attached. This is
  the shared `AwardSummary` type in `packages/shared-types/src/index.ts` — a
  narrower shape than the full `Award` type (no `createdAt`/`description`/
  `givenCount`). Ticket 05 (story picker + feed badges) should render badges
  directly off this `awards` array on each feed item; no separate awards fetch
  needed per feed item.
- `LikesRepository.insertLike` no longer exists — it was replaced in ticket 03
  by `insertLikeWithAwards(values, awardIds)`, which always runs inside
  `db.transaction(...)` (even when `awardIds` is empty) and returns
  `{ success: true, like, awards } | { success: false, missingAwardIds }`
  instead of a bare row. Anything future that creates a `like` row must go
  through this method and handle both result shapes.
- `LikesController.create` can now respond 400 (via `BadRequestException` from
  `LikesService.create`) when `awardIds` references an unknown award id — the
  frontend award picker (ticket 05) should treat `POST /likes` as
  fallible for this reason, not just for the pre-existing validation-error
  400s.
- Local e2e runs (`pnpm --filter e2e exec playwright test`) depend on
  Playwright's `webServer` bringing up `docker compose up --build` on port
  8080. On this machine, port 8080 is sometimes already held by an unrelated
  project's dev server (`ao-fireblocks-callback-handler`, not part of this
  repo) — if e2e fails with "Ports are not available... 0.0.0.0:8080", that's
  a local environment conflict, not a code defect. Do not kill unrelated
  processes to free the port. **Resolved for the round-1 gate run**: the
  review session temporarily edited `docker-compose.yml`'s `web` port mapping
  (`8080:80` → `8081:80`) and `apps/e2e/playwright.config.ts`'s
  `baseURL`/`webServer.url` (`localhost:8080` → `localhost:8081`), ran the
  full suite (22/22 passed, including both `awards-page.spec.ts` and
  `story-award-picker.spec.ts`), then reverted both files with
  `git checkout -- docker-compose.yml apps/e2e/playwright.config.ts`
  immediately after (confirmed clean via `git status`). Reuse this same
  temporary-port trick for any future local e2e run blocked by this same
  conflict — always revert both files afterward, never leave port 8081
  committed.
- Checkbox-group form fields (an array value, not a single input) don't fit
  shadcn's `FormControl` — it wraps a Radix `Slot` that clones one set of
  a11y props (`id`, `aria-describedby`, `aria-invalid`) onto a single child.
  `apps/web/app/page.tsx`'s new `awardIds` `FormField` renders
  `AwardCheckboxList` directly inside `FormItem` without `FormControl` (unlike
  every other field in this form). Follow this precedent for any future
  multi-select/checkbox-group field instead of forcing it through
  `FormControl`.
- Native `<label><input type="checkbox"/><span aria-hidden>{icon}</span><span>{title}</span></label>`
  gives each checkbox an accessible name equal to just the title text (the
  icon span is excluded from accname computation via `aria-hidden`) — no
  manual `aria-label` needed, and `apps/web/app/page.tsx`'s
  `AwardCheckboxList` / `apps/web/components/story-feed.tsx`'s `AwardBadge`
  both rely on this. `story-award-picker.spec.ts` uses
  `page.getByLabel(award.title)` on the strength of this.

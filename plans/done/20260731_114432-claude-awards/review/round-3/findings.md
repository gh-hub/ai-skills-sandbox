# Review round-3 findings

Diff reviewed: `git diff b56f4d790b552953c5b08bdef3ab23e8dbc374eb...5fd970b29de1356567f0c9350c3e99301ce49506`
(`main`...`HEAD`, all work landed in a single commit `5fd970b` "feat: implement awards feature with backend CRUD and frontend integration").

## Spec-match

**(a) Missing or partial requirements:** None. All 11 user stories in `spec.md`
verified as implemented: schema/migration, full awards CRUD module,
`RequireAuthGuard` (method-level only on `POST /awards`, `CurrentUserGuard`
still the only global `APP_GUARD`), `POST /likes` `awardIds` transaction +
400-on-unknown-award, `LikeDto.awards`, shared types, `/awards` page, story-form
checkbox picker, feed badges, `getAwardIcon` fallback, and all backend/e2e test
files.

**(b) Scope creep — confirmed.** Spec's only e2e-related requirement (per
`review/round-2/tickets/01-e2e-global-setup-truncate-cascade.md`) is a
one-line fix: `"TRUNCATE TABLE likes;"` → `"TRUNCATE TABLE likes CASCADE;"` in
`apps/e2e/global-setup.ts`. That fix is present, but the diff also ships an
entire isolated e2e Docker infrastructure never mentioned in `spec.md`:

- `docker-compose.yml` — parameterizes `POSTGRES_USER/PASSWORD/DB/PORT` and
  `WEB_PORT` via env vars (previously hardcoded), changes the default
  published web port from `8080:80` to `${WEB_PORT:-8081}:80`, and adds a new
  `connection-info` service that echoes connection strings on stack startup.
- `package.json` — adds four new root scripts: `docker:up`, `docker:down`,
  `docker:e2e:up`, `docker:e2e:down`.
- `apps/e2e/e2e.config.ts` (new) — defines a separate compose project
  `thanks-claude-e2e` on ports 8082/5434 with its own DB name/creds.
- `apps/e2e/.env.e2e` (new) — backing env for the above.
- `apps/e2e/playwright.config.ts` — rewired to use
  `COMPOSE_ARGS`/`COMPOSE_ENV`/`WEB_PORT` from `e2e.config.ts` instead of
  plain `docker compose` calls on port 8080.
- `apps/e2e/package.json` — adds a new `dotenv` dependency.

`CONTEXT.md`'s own Gotchas section documents the port-8080 conflict as
something to work around locally (temporarily repoint two files, revert after
each run) — not something to solve by shipping a permanent parallel
infrastructure. None of this (isolated compose project, new ports, new
scripts, new dependency) is called for anywhere in `spec.md`.

**(c) Requirements implemented but wrong:** None found.

## Step 4 gate

| Check | Result |
|---|---|
| Lint | N/A — no dedicated lint script/config in this project (unchanged since round 1) |
| Build | PASS — `pnpm --filter api build` and `pnpm --filter web build` both clean |
| Unit/integration | PASS — `pnpm --filter api test`: 10 suites / 102 tests |
| E2E | PASS — `pnpm test` from `apps/e2e` (now against the new isolated `thanks-claude-e2e` compose project): 22/22, including all 5 awards-related tests |

## Verdict

**Initial: FAIL** — spec-match found one finding (scope creep in e2e Docker
infrastructure), even though every step-4 check passed and no requirement is
missing or wrong.

This is round 3, past this plan's standard 2-round auto-fix budget. Per
`SKILL.md`, a live continue/stop decision was required from the user before
any further fix-ticket/implement cycle.

## User decision (live checkpoint)

User reviewed the finding and chose to **accept the e2e Docker infrastructure
as in-scope** rather than revert it — it's a genuine, working fix for a port
conflict this plan's own review process hit twice (rounds 1 and 2), not junk
or unrelated work. `spec.md`'s "Testing Decisions" section was amended with a
new "E2E infrastructure (isolated Docker stack)" subsection documenting it
retroactively.

With the spec now matching the diff, there is no remaining spec-match finding
and the step-4 gate already passed in full (build, unit/integration, e2e all
green; lint N/A).

**Final verdict: PASS.**

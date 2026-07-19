# Context: e2e-ui-testing

## What we're building
A Playwright e2e suite (new `apps/e2e` workspace) that drives the web app against the real API+Postgres stack via docker-compose, plus a new GitHub Actions workflow to run it in CI.

## Key decisions
- Scope: like flow, story form (happy path + validation error), dark mode toggle — see grill/decisions.md
- Real stack via docker-compose, not mocked network — see grill/ADR-001.md
- New apps/e2e workspace package, not nested in apps/web
- Delta assertions + single DB reset per suite run (no per-test reset)
- Playwright webServer manages docker compose up/down
- Chromium only for v1
- CI in scope: .github/workflows/e2e.yml on PRs + push to main
- UI verification convention for this repo is Playwright, not claude-in-chrome — plans/coding-rules/general.md

## Tickets
1. 01-e2e-workspace-foundation — none
2. 02-like-flow-test — blocked by 01
3. 03-story-form-flow-test — blocked by 01
4. 04-dark-mode-toggle-test — blocked by 01
5. 05-ci-workflow — blocked by 01, 02, 03, 04

## Current state
Plan complete (2026-07-19).
Completed tickets: 01-e2e-workspace-foundation, 02-like-flow-test, 03-story-form-flow-test, 04-dark-mode-toggle-test, 05-ci-workflow, review/round-1-fix/01-teardown-respects-reuse-existing-server
Current ticket: (none)
Round 2 result: 0 BLOCK, 5 new DEBT — round-1 BLOCK confirmed fixed. Report at review/round-2/report.md. User decision: done. All DEBT exported to plans/tech-debt/.

## Load this session
- plans/coding-rules/INDEX.md (then only the rule files relevant to the review)
- apps/e2e/ (full workspace: config, global-setup/teardown, tests)
- .github/workflows/e2e.yml
- Diff of all changes introduced by this plan (including the round-1 fix)

## Gotchas
- API migrations run automatically on container start (apps/api/entrypoint.sh runs `drizzle-kit migrate` before `node dist/main.js`) — no separate migration step needed for e2e setup.
- Web is a static export served by nginx (apps/web/Dockerfile → apps/web/out), with nginx proxying `/api/` to the api container (apps/web/nginx.conf). docker-compose exposes web on host port 8080.
- No CI exists in this repo yet (no .github/ dir) — the workflow this plan adds will be the first.
- Playwright's `webServer` teardown kills `docker compose up` with SIGTERM, which does NOT stop the containers (unlike SIGINT/Ctrl-C) — always pair it with an explicit `globalTeardown` running `docker compose down` (see apps/e2e/global-teardown.ts), or containers leak on every run.
- `likes` table reset (apps/e2e/global-setup.ts) needs a retry loop: the web container is reachable before the api container finishes its migrations, so the table may not exist yet on the first attempt(s).
- The like count (`apps/web/app/page.tsx`) has no optimistic update — it only changes after the mutation's `onSuccess` invalidates the query and refetches, so assertions on it need Playwright's auto-retrying matchers (e.g. `toContainText`), not a synchronous read.
- The story-form submit button reuses the same `useSubmitLike` hook as the Like button — submitting the story form also increments the shared like count (`apps/e2e/tests/story-form-flow.spec.ts` asserts this delta directly).
- The story form's validation-error message (`FormMessage` in `apps/web/components/ui/form.tsx`) is a plain `<p data-slot="form-message">` with no `role="alert"` — match it by text content, not role.
- `apps/e2e/playwright.config.ts` now sets `workers: 1`. This is load-bearing, not incidental: once more than one test mutates the shared `likes` counter (as of ticket 03), parallel workers can race on the read-act-assert delta window and produce flaky failures (reproduced locally: expected a count of 1, observed 2, from a concurrent worker's increment landing mid-assertion). Do not remove `workers: 1` without re-solving that race some other way.
- Theme toggle (`apps/web/components/theme-toggle.tsx`) renders `disabled` until client-side mount (`isMounted` guard, to avoid SSR/hydration mismatch) — tests must wait for it to be enabled before clicking, not just visible.
- Theme state lives on `<html class="dark">` (next-themes `attribute="class"`, configured in `apps/web/app/providers.tsx`) and persists via next-themes' own localStorage handling — no app-specific persistence code exists, so the e2e test only needs to check the `dark` class before/after toggle and after reload.
- `.github/workflows/e2e.yml` is the first CI workflow in this repo. It runs `pnpm --filter @thanks-claude/e2e test` from the repo root (not `cd apps/e2e`), which works because the workspace filter resolves regardless of cwd — verified locally by running that exact command from root.
- GitHub's `ubuntu-latest` runner ships Docker Engine + Compose v2 preinstalled, so no extra setup step was needed for `docker compose up` (used by `apps/e2e/playwright.config.ts`'s `webServer`) to work in CI.
- The workflow's actual run in GitHub Actions (ticket 05's 4th acceptance criterion) has not been verified yet — that needs the branch pushed and a PR opened or `workflow_dispatch` run, which wasn't done in the implement session (no push/commit in implement phase).
- `apps/e2e/global-teardown.ts` no longer unconditionally runs `docker compose down`. `apps/e2e/playwright.config.ts` now probes `docker compose ps --status running` synchronously at config-load time — before Playwright decides to reuse or spawn the webServer — and records the result in `process.env.E2E_STACK_WAS_ALREADY_RUNNING`. Teardown skips `docker compose down` only when that env var is `"true"` (stack was already up locally, not CI). This mirrors Playwright's own reuse decision without touching `reuseExistingServer: !process.env.CI` or the webServer command. Known edge case (accepted, not fixed): if a previous run crashes before teardown runs (containers leak), the next run will see them as "already running" and — correctly, if accidentally — not tear them down further; it does not distinguish an intentionally pre-started stack from a leaked one, but treats both the same way Playwright's own reuse check would.

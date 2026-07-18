# Spec: tech-debt-cleanup

## Problem Statement

Two completed plans (`thanks-claude`, `web-app-foundations`) left behind 15 logged tech-debt findings across `apps/api` and `apps/web` — DI bypasses, a fragile env-var assertion, a doc-drift between archived tickets and actual completion state, an undocumented endpoint, Docker images shipping dev tooling (including one dev tool that's actually load-bearing at runtime), missing error handling, a UX gap on fetch failure, a swallowed error object, an inconsistent UI component, an unused dependency, and coupled mutation state. Each was independently re-verified against the current codebase before this plan started — none are stale, already fixed, or duplicates.

## Solution

Resolve all 15 findings with the smallest change that removes each root cause, without introducing new abstractions beyond what each finding needs. One finding (`utils.ts` naming) is resolved as "accepted, not fixed" per an explicit tradeoff decision — renaming would fight shadcn/ui's own tooling conventions for no real benefit.

## User Stories

1. As a developer adding a new module to `apps/api`, I want DB access wired through NestJS DI, so that I inject a provider instead of importing a singleton and repeating the same bypass a third time.
2. As a developer running `apps/api` locally without `DATABASE_URL` set, I want a clear startup error instead of a silent `undefined` flowing into `drizzle-kit`, so that misconfiguration fails fast and legibly.
3. As a developer reading `likes.spec.ts`, I want each test to assert one thing, so that a failure immediately tells me what broke.
4. As a developer reading the archived `thanks-claude` plan, I want its ticket docs and spec to reflect what was actually built, so that the archive is trustworthy documentation rather than a stale snapshot.
5. As an operator running the production images, I want `apps/api` and `apps/web` runtime images to exclude test/build-only tooling, so that images are smaller and the attack surface is reduced — without breaking the migration step that currently depends on one of those tools.
6. As a developer running `generate:openapi`, I want a failure in that script to surface as a clear error rather than an unhandled rejection, so that CI/local failures are diagnosable.
7. As a visitor whose like-count fetch fails, I want a distinct "couldn't load" state with a way to retry, so that I'm not stuck looking at "loading…" forever with only a full page reload as a recovery path.
8. As a developer debugging a failed API call from the web client, I want the real error logged, so that I'm not stuck with only a generic message when something goes wrong.
9. As a visitor, I want the "Share a story" toggle to look and behave consistently with the other buttons on the page, so that the UI doesn't feel inconsistent.
10. As a developer maintaining `apps/web`, I want unused dependencies removed from `package.json`, so that the dependency list reflects what's actually used.
11. As a visitor, I want a failed plain "Like" click to not show a stale error state inside the story form (and vice versa), so that the two actions don't interfere with each other's feedback.

## Implementation Decisions

### DB access via DI (apps/api)
- Introduce a `DbModule` (new file, `apps/api/src/db/db.module.ts`) that provides the existing `db` client (from `db/client.ts`, unchanged) under a `DATABASE_CONNECTION` injection token, and registers itself `@Global()`.
- `LikesController` and `AppController` receive the connection via constructor injection (`@Inject(DATABASE_CONNECTION)`) instead of importing `db` directly from `../db/client` / `./db/client`.
- `AppModule` imports `DbModule` once; because it's `@Global()`, `LikesModule` does not need its own import.
- See ADR-001.md for full rationale.

### Env var boundary check (apps/api)
- `drizzle.config.ts` replaces `process.env.DATABASE_URL!` with an explicit check that throws a descriptive error (e.g. `"DATABASE_URL is required"`) if the variable is unset, before constructing the config object.

### Test assertion split (apps/api)
- `likes.spec.ts`'s "creates a like with no body fields" test is split into two tests: one asserting the `story`/`hoursSaved` shape via `toMatchObject`, one asserting `id` is a string. Test descriptions name the scenario being asserted, not just "part 1/part 2."

### Archived plan doc corrections (plans/done/20260718_115923-thanks-claude/)
- `tickets/02-like-count-api.md` and `tickets/03-like-button-ui.md`: check every acceptance box that reflects completed work, and change `**Status:** ready` to `**Status:** done`.
- `spec.md`: add `GET /health` to the "API contract" bullet list, describing it as a liveness check that also verifies DB connectivity (matching the current implementation).

### drizzle-kit reclassification + Docker pruning (apps/api, apps/web)
- Move `"drizzle-kit"` from `devDependencies` to `dependencies` in `apps/api/package.json`, reflecting that `entrypoint.sh` runs it at container runtime.
- `apps/api/Dockerfile`: after the build step, add a prune/deploy step (`pnpm deploy` or equivalent `--prod` install) so the final image installs only production dependencies — `drizzle-kit` is now included as a real dependency; `jest`, `ts-jest`, `@testcontainers/postgresql`, `@types/*`, `supertest`, `@nestjs/cli`, `@nestjs/testing` are excluded.
- `apps/web/Dockerfile`: same prune treatment for its own devDependencies before the static export is built/copied into the nginx stage (the build stage still needs devDependencies to run `next build`; only the final artifact/stage should exclude them — in this Dockerfile's case the static `out/` directory already carries no `node_modules`, so verify whether a prune step is even needed here versus just confirming no devDependency artifacts leak into `out/`).
- See ADR-002.md for full rationale.

### generate-openapi.ts error handling (apps/api)
- Wrap the body of `generateOpenApiDocument()` in try/catch; on error, log the error and `process.exit(1)` so a CI failure is unambiguous instead of an unhandled promise rejection.

### Like-count fetch failure UX (apps/web)
- In `page.tsx`, when `likeCount.isError` is true, replace the `"loading…"` fallback with a distinct message (e.g. `"Unable to load like count"`) instead of falling through the existing `isLoading || data === undefined` ternary.
- Add a small retry control next to that message that calls `likeCount.refetch()`.
- The existing `role="alert"` banner for `likeCount.isError` may be consolidated with this inline message rather than shown twice — implementer's call on exact layout, as long as both the stuck-loading text and the redundant double-messaging are resolved.

### Swallowed error logging (apps/web)
- In `lib/api-client/likes.ts`, before each `throw new Error(...)`, add `console.error(error)` (the real `openapi-fetch` error object) so the underlying detail isn't lost. The thrown message and UI-facing text are unchanged.

### Share-story toggle (apps/web)
- Replace the raw `<button>` (`page.tsx`, "Share a story"/"Hide story" toggle) with the shadcn `Button` component already imported and used elsewhere on the page. Preserve its current behavior (`onClick={() => setIsExpanded((prev) => !prev)}`) and text.

### Unused shared-types dependency (apps/web)
- Remove `"@thanks-claude/shared-types": "workspace:*"` from `apps/web/package.json` dependencies.
- Confirm no remaining references anywhere in `apps/web` (not just `.ts`/`.tsx` — also check config files, e.g. `next.config`, `tsconfig.json` path aliases) before removing.

### Mutation state split (apps/web)
- In `page.tsx`, call `useSubmitLike()` twice — once for the bare Like button's `onClick`, once for the story form's submit handler — as two independently-named variables (e.g. `likeSubmit` and `storySubmit`), each with its own `isPending`/`isError` used only by its own UI region.
- Both instances still invalidate the same `likeCountQueryKey` on success (unchanged in `useSubmitLike`'s own `onSuccess`), so the displayed count stays correct regardless of which instance fired.

## Testing Decisions

- **apps/api DI change**: existing `likes.spec.ts` end-to-end tests (real Postgres via testcontainers) continue to exercise `POST /likes` and `GET /likes/count` through the HTTP layer — this is the existing, highest test seam and requires no new seam. If `DbModule` makes it easy to override the connection in a NestJS testing module, that's a nice-to-have, not a requirement — the current tests already pass a real Postgres connection through `AppModule` and should keep doing so unchanged in spirit.
- **Test assertion split**: verified by running the existing test suite; the split test still passes against the same real Postgres testcontainer.
- **drizzle.config.ts boundary check**: no automated test exists for this file today (it's drizzle-kit tooling config, not app code) — manually verify by running `pnpm db:generate`/`db:migrate` with and without `DATABASE_URL` set, confirming the unset case throws the new descriptive error instead of drizzle-kit's own cryptic failure.
- **Docker/drizzle-kit changes**: no existing automated test seam for Docker image contents. Manually verify: `docker compose up` still runs migrations and serves traffic; inspect the built `apps/api` image to confirm `drizzle-kit` is present and `jest`/`ts-jest`/`testcontainers` are not.
- **generate-openapi.ts**: no existing test seam. Manually verify by temporarily breaking `NestFactory.create` (or simulating a write failure) and confirming a clear logged error + non-zero exit instead of an unhandled rejection.
- **Web UI changes** (stuck-loading UX, share-story button, mutation split): this repo has no automated frontend test seam (confirmed in the original `thanks-claude` spec — "Frontend testing is out of scope for automated coverage," never added since). Verify manually in a browser: simulate a `/likes/count` failure (e.g. stop the API) and confirm the distinct error text + working retry button; confirm the story toggle renders as a shadcn `Button`; confirm a failed plain Like click no longer shows an error inside the expanded story form.
- **Unused dependency removal**: verified by `pnpm install` succeeding and `pnpm --filter @thanks-claude/web build` succeeding with the dependency removed.

## Out of Scope

- Any new features beyond what each of the 15 findings describes.
- Re-litigating the `utils.ts` naming convention — resolved as accepted-as-is.
- Broader DI refactors beyond the two call sites that bypass it today (`LikesController`, `AppController`).
- Adding a frontend automated test harness — none exists, and none of these fixes require introducing one.
- Changing the `likes` schema, API contract shapes, or Docker Compose service topology.

## Further Notes

- The `apps/web/Dockerfile` prune step (see Implementation Decisions) may turn out to be a no-op once the implementer checks whether `node_modules` from the build stage ever reaches the final `nginx` stage — the `COPY --from=build /repo/apps/web/out` line suggests it might not. Confirm during implementation and adjust the ticket scope down if so; don't invent work where none exists.
- Items #4/#5 modify files under `plans/done/20260718_115923-thanks-claude/` — an archived plan folder, not this plan's own artifacts. This is a deliberate, user-confirmed exception (see grill/decisions.md).

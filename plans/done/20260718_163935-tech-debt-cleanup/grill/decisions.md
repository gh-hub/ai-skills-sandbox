## Decision: DB access via NestJS DI module
Decided: Create a `DbModule` exposing a `DATABASE_CONNECTION` provider token, registered `@Global()`. Inject it via constructor into `LikesController`/`LikesService` and `AppController` instead of importing the `db` singleton directly.
Why: Idiomatic NestJS DI; fixes both logged instances (`likes.controller.ts`, `app.controller.ts`) with one shared module instead of two one-off patches.
Alternatives rejected: Wrapping the singleton in an injectable `DatabaseService` class — smaller diff but less idiomatic, and doesn't address the underlying DI-bypass pattern as cleanly.
See ADR-001.md.

## Decision: drizzle-kit becomes a production dependency
Decided: Move `drizzle-kit` from `devDependencies` to `dependencies` in `apps/api/package.json`.
Why: `entrypoint.sh` runs `pnpm exec drizzle-kit migrate` at container runtime — it's load-bearing in production, not just a dev tool. This unblocks a safe `--prod` prune for the rest of devDependencies (jest, ts-jest, testcontainers) in both Dockerfiles.
Alternatives rejected: Running migrations from the builder stage as a separate init step — avoids bloating the dependency list but adds Docker build complexity; moving the dependency is simpler and matches actual runtime behavior.
See ADR-002.md.

## Decision: Fix archived plan docs in place
Decided: Edit `plans/done/20260718_115923-thanks-claude/tickets/02-like-count-api.md` and `03-like-button-ui.md` to check completed acceptance boxes and flip `Status: ready` → `done`. Add `GET /health` to that plan's `spec.md` API contract section.
Why: These are small, low-risk doc corrections; leaving them wrong forever is worse than a one-line archive edit, even though the plan itself is done.
Alternatives rejected: Leaving archived docs untouched as "historical record" — rejected because the docs are simply inaccurate, not a meaningful historical snapshot worth preserving as-is.

## Decision: utils.ts stays as-is
Decided: Do not rename `apps/web/lib/utils.ts` despite the generic-name rule. Mark the backlog item as accepted, not fixed.
Why: It's the shadcn/ui CLI's expected import path (`@/lib/utils`); renaming requires reconfiguring `components.json`'s alias and risks breaking future `npx shadcn add` runs.
Alternatives rejected: Renaming to something specific (e.g. `class-utils.ts`) — rejected, not worth the ongoing friction with shadcn tooling for a low-priority naming nit.

## Decision: Like-count fetch failure gets explicit error state + retry
Decided: When `likeCount.isError`, render "Unable to load like count" in place of the count, with a retry button that calls `refetch()`.
Why: Closes the UX gap where "loading…" and an error banner rendered simultaneously with no way to recover without a full page reload.
Alternatives rejected: Fixing only the stuck text with no retry button — smaller change, but leaves the user with only a full-page-reload recovery path.

## Decision: Swallowed error gets logged, not surfaced in UI
Decided: In `lib/api-client/likes.ts`, `console.error(error)` the real `openapi-fetch` error object before throwing the existing generic `Error` message. UI-facing text is unchanged.
Why: Restores debuggability (the real error is visible in logs/console) without exposing potentially unsafe error detail to end users.
Alternatives rejected: Surfacing `error.message` directly in the UI — rejected as a boundary-safety concern; server error messages aren't vetted for end-user display.

## Decision: Split the shared mutation instance
Decided: Give the bare "Like" button and the story-form submit each their own `useSubmitLike()` instance in `page.tsx`.
Why: Removes the coupling where a failed plain "Like" click could leave a stale pending/error state visible in the unrelated story form.
Alternatives rejected: Keeping one mutation and manually scoping UI state with a local "which action fired" flag — more code for the same outcome; two independent hook instances is simpler and matches how react-query mutations are meant to be used.

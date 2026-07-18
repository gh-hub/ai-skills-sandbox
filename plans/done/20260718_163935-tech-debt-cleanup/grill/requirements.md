# Requirements: tech-debt-cleanup

## Problem

Two completed plans (`thanks-claude`, `web-app-foundations`) left behind 15 logged tech-debt items across `apps/api` and `apps/web`. These were verified still relevant against the current codebase (none stale, fixed, or duplicate) before this plan started. This plan exists purely to close them out.

## What we're fixing

**apps/api**
1. `likes.controller.ts` and `app.controller.ts` both import the `db` singleton directly instead of via DI.
2. `drizzle.config.ts` uses `process.env.DATABASE_URL!` instead of a boundary check.
3. `likes.spec.ts`'s "creates a like with no body fields" test combines two unrelated assertions.
4. Archived ticket docs (`02-like-count-api.md`, `03-like-button-ui.md`) still show `Status: ready` and unchecked boxes despite the work being done.
5. `GET /health` isn't documented in the archived plan's `spec.md` API contract section.
6. Both Dockerfiles ship devDependencies in the runtime image (no prod prune).
7. (duplicate DI smell, same fix as #1) — `app.controller.ts`.
8. `drizzle-kit` is a devDependency but runs at container runtime via `entrypoint.sh` — load-bearing in production.
9. `generate-openapi.ts` has no try/catch around `NestFactory.create`/`writeFileSync`.

**apps/web**
10. `lib/utils.ts` has a generic name, but renaming would break shadcn/ui conventions.
11. On a like-count fetch failure, the UI shows "loading…" and an error banner at the same time, with no retry.
12. `lib/api-client/likes.ts` discards the real `openapi-fetch` error object before throwing a generic one.
13. The "Share a story" toggle button is a raw `<button>` instead of shadcn's `Button`.
14. `@thanks-claude/shared-types` is still listed as a web dependency but is unused.
15. The bare "Like" button and the story-form submit share one mutation instance, coupling their pending/error UI state.

## Done looks like

- All 15 items resolved per the decisions below (one item — utils.ts — resolved as "accepted, not fixed").
- `plans/tech-debt/` no longer contains these 15 files (already removed once this plan's grill output was saved).
- Existing tests still pass; no regressions to the like/count flow.

## Out of scope

- Any new features beyond what each finding describes.
- Re-litigating the shadcn/ui scaffolding convention for `utils.ts`.
- Broader DI refactors beyond the two call sites that bypass it today.

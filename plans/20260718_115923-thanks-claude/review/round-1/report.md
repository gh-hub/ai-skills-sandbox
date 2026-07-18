# Review Round 1

## Standards

Scope: real logic is in `apps/api/src/**`, `apps/web/app/page.tsx`, `packages/shared-types`, plus Docker/config scaffolding. `pnpm-lock.yaml` (7.7k lines) and plan docs are noise, skipped.

### apps/web/app/page.tsx — BLOCK
```js
const fetchCount = () => {
  fetch("/api/likes/count")
    .then((res) => res.json())
    .then((data) => setCount(data.count))
    .catch(() => {});
};
```
Silently swallowed error — violates general.md "Do not swallow errors silently." If the fetch fails, `count` stays `null` ("loading…") forever with no signal to the user or console.

Related: `submitLike` is invoked fire-and-forget from `handleLikeClick` and `handleStorySubmit` with no `.catch`/await at all — a failed like/story submit is invisible to the user (form clears, `isExpanded` collapses, as if it succeeded). Inconsistent with the `fetchCount` swallow — one hides the error, the other never handles it. Both are the same underlying issue: no user-facing error handling at this network boundary, which is exactly where general.md says errors should be handled.

### apps/api/src/likes/likes.module.ts + likes.controller.ts — DEBT (judgement call)
Controller imports the `db` singleton directly from `../db/client` rather than through the module/DI. Works fine at this scale, but it's Shotgun Surgery risk the moment a second module needs the DB (each new module reaches into the same concrete file rather than depending on an injected provider). Given this is ticket 1's scaffold, acceptable for now — flag as debt to revisit once a second consumer of `db` appears, not a blocker.

### apps/api/drizzle.config.ts — DEBT
```ts
url: process.env.DATABASE_URL!,
```
Non-null assertion masks a missing-env-var failure with a cryptic downstream error instead of a clear boundary check. Minor, not a shipped-code path (build-time tool only).

### apps/api/src/likes/likes.spec.ts — DEBT (judgement call)
"creates a like with no body fields" test asserts both `toMatchObject` and a separate `id` expectation — general.md prefers one assertion per test. Minor, not worth blocking; the two assertions are tightly related (same response shape).

### Dockerfiles (apps/api/Dockerfile, apps/web/Dockerfile) — no violation
Near-identical COPY/pnpm-install sequences, but with only two images, extracting a shared base stage would be speculative generality per general.md's over-engineering rule. Leave as-is.

### Compliant / no issues found
- `apps/api/tsconfig.build.json` correctly sets `rootDir: "./src"` and excludes `drizzle.config.ts`/`drizzle` — matches node-typescript-docker.md exactly.
- `.dockerignore` excludes `**/*.tsbuildinfo` — matches the documented rule.
- No commented-out code, no naming violations (`isExpanded` etc. follow the `is/has/can` boolean convention), no function exceeds 3 params, no repeated switches/inheritance smells found.

## Spec

**(a) Missing/partial requirements**

- DEBT — "Tickets phase should settle it explicitly" / ticket checkboxes: `plans/20260718_115923-thanks-claude/tickets/02-like-count-api.md` and `03-like-button-ui.md` still have every acceptance box unchecked (`[ ]`) and `**Status:** ready`, while `PROGRESS.md` claims `implement/02-like-count-api` and `implement/03-like-button-ui` are `[x]` done and the code for both is present in the diff. The ticket artifacts weren't updated to reflect completed work — a process/documentation gap, not a code defect.

**(b) Scope creep**

- DEBT — `GET /health` (`apps/api/src/app.controller.ts`) is not in the spec's "API contract" section (spec only lists `POST /likes` and `GET /likes/count`). It's traceable to ticket 01's own acceptance criteria ("connects to Postgres... GET /health"), so it's pre-authorized scaffolding rather than the implementer inventing scope, but it's still surface not called for by the top-level spec.
- DEBT — Dockerfiles run `pnpm install --frozen-lockfile` with no `--prod`/prune step, so `devDependencies` (including `drizzle-kit`, `jest`, `ts-jest`, `@testcontainers/postgresql`) ship in the runtime image. Not spec-mandated, bloats the image; harmless for local-only Compose use but worth flagging as unaddressed.

**(c) Implemented-but-wrong**

None found. Specifically verified and correct:
- `SwaggerModule.setup("docs", ...)` mounts internally at `/docs`; combined with nginx's `location /api/` → `proxy_pass http://api:3000/` (trailing-slash strip), this correctly surfaces as `/api/docs` from the browser — matches spec `@nestjs/swagger mounted at /api/docs` despite looking off at first glance.
- `count()` from drizzle-orm uses `.mapWith(Number)`, so `GET /likes/count` really returns a JS number, not a stringified bigint — no bug.
- Migrations-at-startup decision is resolved (not left as an open question): `apps/api/entrypoint.sh` runs `drizzle-kit migrate` then `exec node dist/main.js`, matching ADR-001's "documented ticket-level decision" requirement.
- Global `ValidationPipe({ whitelist: true, transform: true })` is present both in `main.ts` and duplicated correctly in the test bootstrap (`likes.spec.ts`).
- Shared types (`CreateLikeRequest`, `Like`, `LikeCount`) are defined once in `packages/shared-types/src/index.ts` and consumed by both API DTOs (`create-like.dto.ts`, `like.dto.ts` via `implements`) and the frontend (`page.tsx`) — satisfies the no-drift requirement.
- All four required test cases from the Testing Decisions section are present in `apps/api/src/likes/likes.spec.ts` (empty body, story+hoursSaved, multi-create count delta, 400 on bad `hoursSaved` type), run against a real Testcontainers Postgres.
- No CORS config on API, no dedup logic anywhere, package name `@thanks-claude/shared-types` fixed as required by Further Notes.

## Summary
BLOCK findings: 1
DEBT findings: 6
Worst BLOCK: `apps/web/app/page.tsx` swallows/ignores fetch errors on count-load and like/story submission with no user-facing signal.

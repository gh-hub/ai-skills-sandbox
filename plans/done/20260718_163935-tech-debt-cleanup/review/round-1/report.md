# Review Round 1

## Standards

## Code-Standards Review — tech-debt-cleanup

**apps/api/Dockerfile** — `ENV CI=true` added and `pnpm prune --prod` now runs after `WORKDIR /repo/apps/api`. Compliant with the pnpm-prune Docker rule. No violation.

**apps/api/drizzle.config.ts** — Replaced `!` assertion with an explicit `if (!process.env.DATABASE_URL) throw`. Legitimate boundary check (external env input). No violation.

**apps/api/package.json** — `drizzle-kit` moved from devDependencies to dependencies. Correct per the pnpm-prune rule (keeps the runtime CLI symlink alive after prune). No violation.

**apps/api/src/db/db.module.ts + app.controller.ts + likes.controller.ts** — DEBT (judgement call): `DbModule` wraps the existing `db` singleton behind a `DATABASE_CONNECTION` token, but `likes.spec.ts` still bootstraps tests via `process.env.DATABASE_URL` + direct `import { pool } from "../db/client"` — nothing ever overrides the token. This is **Speculative Generality / Middle Man**: the DI indirection exists but nothing uses the substitutability it exists for.
Compounding this, both controllers repeat identical boilerplate: `import type { db as Database } from "../db/client"` + `@Inject(DATABASE_CONNECTION) private readonly db: typeof Database`. That's **Duplicated Code**, and aliasing a value import as `Database` (capital-D, reads like a class) is a **Mysterious Name** — a shared exported type (e.g. `export type DbClient = typeof db`) would fix both.
Separately, `@Global()` on `DbModule` is load-bearing — `LikesModule` never imports `DbModule` yet its controller depends on `DATABASE_CONNECTION` purely because the module happens to be global. That's a hidden cross-module dependency invisible from `LikesModule`'s own imports — closest baseline smell is **Shotgun Surgery** risk (removing `@Global()` breaks `LikesModule` with no local signal why).

**apps/api/src/generate-openapi.ts** — try/catch + `process.exit(1)` wraps a CLI script entrypoint. Correct boundary-error handling. No violation.

**apps/api/src/likes/likes.spec.ts** — Split one test into two single-assertion tests with scenario-based names. Matches the testing rule exactly. No violation.

**apps/web/app/page.tsx** — Split `submitLike` into `likeSubmit`/`storySubmit` for independent pending/error state — legitimate, not duplication. Nested ternary for the like-count error/loading/data states is a minor readability judgement call, not a rule violation.

**apps/web/lib/api-client/likes.ts** — `console.error(error)` added before throwing a fresh `Error(...)`; original error detail isn't attached (no `{ cause }`), so it's only visible in console, not to callers. Minor DEBT, judgement call, not silent swallowing.

**apps/web/Dockerfile / package.json** — Dropped now-unused `@thanks-claude/shared-types` copy/build steps consistently. No violation.

No BLOCK-level findings — everything above is DEBT/judgement-call level.

## Spec

The reference note checks out and matches the archived review's actual finding text. The implementation is well-conformant overall. Here is my report.

## Spec-Conformance Review: tech-debt-cleanup

All 10 fix-required findings are implemented and traced correctly against the diff; `utils.ts` was correctly left untouched. One real issue found, plus a couple of minor notes.

**1. BLOCK — `ENV CI=true` leaks into the production runtime container (apps/api).**
Spec: *"an operator running the production images ... runtime images to exclude test/build-only tooling ... without breaking the migration step."* The fix (`plans/coding-rules/node-typescript-docker.md`: *"set `ENV CI=true` beforehand, since `pnpm prune` refuses to run without a TTY"*) is applied correctly for `apps/web`, which is a multi-stage build (`FROM ... AS build` → `FROM nginx`), so the env var never reaches the shipped image. But `apps/api/Dockerfile` is single-stage — `FROM node:22-alpine` through `ENTRYPOINT` — so `ENV CI=true` set at line 3 persists into the actual running container, not just the build. Any runtime code path (NestJS, drizzle-kit, logging libs) that branches on `process.env.CI` now behaves differently in production than intended. This is a real, unintended behavior change introduced by the fix itself, not merely cosmetic — recommend scoping the var to the prune command (e.g. `RUN CI=true pnpm prune --prod`) instead of a Dockerfile-wide `ENV`.

Verified independently (confirmed by primary reviewer): `apps/api/Dockerfile` is indeed single-stage, and `entrypoint.sh` runs `pnpm exec drizzle-kit migrate` then `exec node dist/main.js` at container start — both execute with `CI=true` in the environment at runtime, not just during the image build.

**2. No other gaps found.** Verified each item concretely:
- DI: `db.module.ts` (untracked, now read) matches spec exactly — `@Global()`, `DATABASE_CONNECTION` token, `useValue: db`; `AppController`/`LikesController` inject it; `LikesModule` correctly left untouched since the module is global.
- `drizzle.config.ts` throws before use; `likes.spec.ts` split into two well-named tests.
- Archived ticket docs: boxes checked appropriately; the one intentionally left unchecked (shared-types typing in ticket 03) has an accurate cross-reference to the original round-1 debt note — verified the quoted text matches `plans/done/.../review/round-1/report.md:28` verbatim.
- `spec.md` `GET /health` bullet added, matching actual behavior.
- Docker pruning: `apps/api` prune correctly scoped to `WORKDIR /repo/apps/api` (not root), `drizzle-kit` moved to `dependencies` in both `package.json` and `pnpm-lock.yaml` (lockfile updated in sync — checked, avoids a frozen-lockfile break). `apps/web` correctly adds no prune step since its nginx stage only copies `out/`, never `node_modules` — matches the spec's "verify whether a prune step is even needed" escape hatch.
- `generate-openapi.ts`: try/catch wraps the full body, logs, `process.exit(1)`.
- `page.tsx`: distinct "Unable to load like count" + retry (`refetch()`) replaces stuck "loading…"; no duplicate alert banners. `likes.ts` logs the real error before both throws. Toggle now uses shadcn `Button`, behavior/text preserved. `likeSubmit`/`storySubmit` are independent instances, each showing its own `isError` in its own region; both still invalidate the shared query key.
- `@thanks-claude/shared-types` removed from `apps/web/package.json`; grep confirms zero remaining references anywhere under `apps/web`.

No scope creep found beyond the 15 findings; no requirement looks implemented-but-wrong other than the CI=true item above.

## Summary
BLOCK findings: 1
DEBT findings: 5
Worst BLOCK: `ENV CI=true` in `apps/api/Dockerfile` is a Dockerfile-wide directive that leaks into the final running container (single-stage build), silently changing runtime behavior instead of only affecting the build-time prune step.

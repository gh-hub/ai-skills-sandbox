# Review Round 3

## Standards

# Coding-Standards Review — Round 3

## apps/web/app/page.tsx — round-2 fix itself

Clean. The unconditional `setError(null)` calls after `await submitLike(...)` in `handleLikeClick` and `handleStorySubmit` are gone; `fetchCount`'s own success/failure branches are now the sole owner of `error` state for the refetch path. Traced both flows (POST-fail, POST-succeeds/refetch-fails, full success) — no scenario clears a live error incorrectly, and the story-form reset stays correctly gated on POST success only. No standards violations in this hunk.

**DEBT** (judgement call, not new to this diff but not previously logged): `submitLike` violates "A function does one thing" and "No side effects that callers can't see from the signature" — its `Promise<void>` signature says "submit a like," but it also triggers `fetchCount()`, which mutates `count` and `error` state as a side effect invisible to callers. This is the actual root cause behind the round-1 and round-2 bugs (callers kept assuming they knew `submitLike`'s full effect on `error` and got it wrong twice). Recommend making the refetch an explicit second call at each call site rather than folding it into `submitLike`, so the side effect is visible in the caller code.

## apps/api/src/likes/likes.spec.ts

**DEBT** (minor, judgement call): "creates a like with no body fields" (lines ~372-377) asserts via both `toMatchObject({...})` and a separate `expect(response.body.id).toEqual(...)` — two assertions where the standard prefers one per test "where possible." Low severity; both checks are about the same created object.

Otherwise compliant: scenario-named tests, real Postgres via testcontainers (no internal mocking — exceeds the boundary-only-mocking bar by not mocking at all), single-assertion in the other three tests.

## Everything else

- `.dockerignore`, `apps/api/tsconfig.build.json` correctly implement both node-typescript-docker.md rules (tsbuildinfo excluded; rootDir `./src` + drizzle.config.ts/drizzle excluded) — compliant, not a finding.
- No comments-describing-what-code-does, no commented-out code, no over-engineering beyond what spec/tickets call for (Swagger, class-validator, testcontainers are all spec-mandated).
- `apps/api/src/app.controller.ts`, `likes.controller.ts` — same DB-bypasses-DI smell as before; already logged, not worsened, skipped per instructions.
- `entrypoint.sh`, Dockerfiles, docker-compose.yml, shared-types package — no violations found.

No BLOCK findings this round.

## Spec

## Round 3 Spec-Conformance Review — thanks-claude

**The round-2 fix is correct and complete.** `handleLikeClick` and `handleStorySubmit` in `apps/web/app/page.tsx` no longer call `setError(null)` after `submitLike()` succeeds. `fetchCount()` (called internally by `submitLike`) now owns `error` state end-to-end: it sets `error` to `null` on its own success and sets a distinct message on its own failure, without being clobbered. Verified all three paths:
- POST succeeds + refetch succeeds → error cleared, count updates (spec story 3: "the displayed count to reflect my like right after I click it").
- POST succeeds + refetch fails → `fetchCount`'s own catch sets "Couldn't load the like count…"; form still clears/collapses in `handleStorySubmit` since the story *was* recorded — correct, not a bug.
- POST fails → outer catch sets "Couldn't record your like…"/"Couldn't submit your story…", form input preserved.

No BLOCK found. This closes round 2's BLOCK (invisible error via unconditional clear).

### (a) Missing/partial
None new. Full contract present: `POST /likes`, `GET /likes/count`, global `ValidationPipe({whitelist,transform})`, Swagger at internal `/docs` (→ `/api/docs` externally via nginx's `/api/` proxy_pass strip — spec: *"@nestjs/swagger mounted at /api/docs"*, confirmed correct again this round), shared types with no drift, migrations-at-startup via `entrypoint.sh`, all four required test cases in `likes.spec.ts`.

### (b) Scope creep
None new beyond already-logged `GET /health` (pre-authorized by ticket 01, not spec's top-level API contract) — unchanged DEBT.

### (c) Implemented-but-wrong
None found this round.

### Carried-forward DEBT (unchanged, re-verified present, not new)
- DEBT — `apps/api/src/likes/likes.controller.ts` and `app.controller.ts` both import `db` directly, bypassing DI (Standards, spec-adjacent).
- DEBT — `apps/api/drizzle.config.ts`: `process.env.DATABASE_URL!` non-null assertion vs. boundary check.
- DEBT — `apps/api/entrypoint.sh` runs `drizzle-kit migrate` at runtime, making a devDependency load-bearing in prod.
- DEBT — Round 2's residual UX rough edge: initial-load `fetchCount()` failure still leaves count at "loading…" forever alongside the error banner (spec story 1: *"see the current total like count when I load the page"* — degraded but not silent, no retry path).

No new issues found in `docker-compose.yml`, Dockerfiles, `nginx.conf`, DTOs, schema, or `likes.spec.ts` beyond what rounds 1–2 already logged. Diff is spec-conformant; remaining items are pre-existing DEBT, safe to ship or defer per prior rounds' judgement calls.

## Summary
BLOCK findings: 0
DEBT findings: 1 new (submitLike hidden side-effect on error/count state — likes.spec.ts two-assertions-in-one-test was already logged in round 1, not re-added), plus all prior rounds' DEBT re-verified present and unchanged
Worst BLOCK: none — round-2's fix holds; no blockers found this round.

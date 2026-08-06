# Review Round 1

## Standards

**apps/api** (DI/db-token cleanup): `app.controller.ts`, `likes.controller.ts`, `db.module.ts` — replacing `typeof Database` value-import with an exported `DbClient` type alias, and `likes.module.ts` importing `DbModule` — are clean, correctly scoped fixes for the "unexercised token" and "hidden global dependency" tickets. No violations.

`likes.spec.ts`: now resolves the pool via `moduleRef.get<DbClient>(DATABASE_CONNECTION).$client` instead of importing `pool` directly — correctly exercises the DI token. Minor judgment call: reaching into drizzle's internal `.$client` couples the test to an implementation detail of the DB client wrapper, but it's a reasonable boundary given no cleaner accessor exists. **DEBT** (judgment call), not a blocker.

**apps/web**: `page.tsx` extracts `renderLikeCount` and swaps the raw `<button>` for shadcn `<Button>` — fixes both the nested-ternary and non-shadcn-button tickets cleanly.

`api-client/likes.ts`: `throwApiError(error, message)` dedupes the console.error+throw pairs and adds `{ cause: error }` (fixes the "no cause" ticket). Judgment call/**DEBT**: the helper both logs *and* throws — arguably two responsibilities per the "a function does one thing" rule — but this is standard error-boundary handling, not a hard violation, and it removes real duplication, so net positive.

**apps/e2e**:
- `playwright.config.ts` / `global-setup.ts`: merging teardown into `globalSetup`'s returned function is Playwright's documented pattern. However, `wasAlreadyRunning` is exported *from the config module* and imported by `global-setup.ts` — a config file now holds runtime probe state consumed elsewhere. This is a Middle-Man/layering smell (config module doing more than configuring) even though the accompanying comment justifies the ordering constraint well. **DEBT**, judgment call — works, but if this dependency direction grows it'll need a real shared module.
- **Naming violation (hard rule)**: `wasAlreadyRunning` doesn't start with `is`/`has`/`can` as required by the Boolean naming rule. Contrast with `isStackAlreadyRunning`, which is compliant. Cheap fix (`isAlreadyRunning`/`isStackReused`); flag as **DEBT** since it's cosmetic and not functionally risky, but it's an unambiguous standard breach worth calling out explicitly.
- `isStackAlreadyRunning` try/catch + `REQUIRED_SERVICES` set check correctly fix the "no try/catch" and "partial-match false positive" tickets, with a WHY-comment justifying the swallow — compliant.
- Removing `fullyParallel: true` (redundant given `workers: 1`) is correct.
- `helpers.ts`/`getLikeCount`: fixes the duplicated-parsing ticket, but the locator regex `/\d+ likes/` is still duplicated across the two spec files and the helper itself (3 occurrences) — residual Duplicated Code. **DEBT**, not a blocker since the original targeted duplication (the parsing regex tuple) is gone.

No BLOCK-level findings — all issues are DEBT/judgment calls.

## Spec

Compiles clean. All 14 spec items check out against the diff.

**No BLOCK items found.** Every implementation decision (items 1–7, 10–14) matches the spec's "what done looks like" exactly:

- Item 1: `moduleRef.get<DbClient>(DATABASE_CONNECTION).$client` replaces raw `pool` import in `likes.spec.ts` — confirmed, and `tsc --noEmit` passes clean.
- Item 2: `DbClient` type exported from `db.module.ts`, used in both `app.controller.ts` and `likes.controller.ts` — confirmed, no more per-file `import type { db as Database }`.
- Item 3: `LikesModule` now has `imports: [DbModule]` — confirmed.
- Item 4: `renderLikeCount` early-return helper replaces the nested ternary in `page.tsx` — confirmed, same markup.
- Item 5: `throwApiError(error, message)` helper used by both `useLikeCount` and `useSubmitLike` — confirmed.
- Item 6: retry `<button>` → shadcn `Button` (`variant="link" size="sm"`), same `refetch()` call, same position inside the alert span — confirmed, this is the one allowed visible change per spec.
- Item 7: new `apps/e2e/tests/helpers.ts` exports `getLikeCount(page)`, used at all 3 call sites; the `likeCount` locator is still declared separately at each site and used afterward for `toContainText` — confirmed exactly as required.
- Items 8/9: no test-splitting occurred — `like-flow.spec.ts`/dark-mode/story-form specs remain single tests as required — no scope creep.
- Item 10: `global-teardown.ts` deleted, `globalTeardown` config option removed, `process.env.E2E_STACK_WAS_ALREADY_RUNNING` round-trip gone, `wasAlreadyRunning` now exported from `playwright.config.ts` (kept there per the documented deviation, with a clear comment explaining why — matches the spec's explicit note not to flag this), and `global-setup.ts`'s default export now returns a teardown closure — confirmed.
- Item 11: single `const isCI = Boolean(process.env.CI)` used for both the stack-probe gate and `reuseExistingServer` — confirmed.
- Item 12: `isStackAlreadyRunning()`'s `execFileSync` wrapped in try/catch, returns `false` on Docker-unreachable — confirmed.
- Item 13: probe now parses `--format json` output and checks all of `web`/`api`/`postgres` are present via a `Set` of `.Service` names, not just non-empty output — confirmed.
- Item 14: `fullyParallel: true` removed from `playwright.config.ts`, `workers: 1` retained — confirmed.

No scope creep detected — no unrelated files touched, no dependency/stack upgrades, no new automated coverage added for items 6/10-14 (matches "Testing Decisions" in Out of Scope).

Only a **DEBT**-level nitpick, not a spec violation: in `global-setup.ts`, the `for` loop's success path does `break` then falls through to the new `return async () => {...}` — functionally correct but slightly less obvious than an early `return` would have been; purely stylistic, no behavior issue.

## Summary
BLOCK findings: 0
DEBT findings: 6
Worst BLOCK: none

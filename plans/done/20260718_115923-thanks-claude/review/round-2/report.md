# Review Round 2

## Standards

**apps/web/app/page.tsx — new regression in the round-1 fix (BLOCK)**

```js
const handleLikeClick = async () => {
  try {
    await submitLike({});
    setError(null);
  } catch { setError("Couldn't record your like. Please try again."); }
};
```
`submitLike` calls `fetchCount()` after a successful POST. `fetchCount` swallows its own failure internally (`catch { setError("Couldn't load the like count…") }`) and does not rethrow. So when the POST succeeds but the subsequent GET fails, `submitLike` returns normally, and `handleLikeClick`'s success path immediately runs `setError(null)`, wiping out the error `fetchCount` just set. The user sees no error and no count update — silently. This is the exact class of bug round 1 flagged as BLOCK (invisible failure), just reintroduced on a different path. Same pattern exists in `handleStorySubmit`. Fix: don't call `setError(null)` unconditionally after `submitLike`, or have `fetchCount` propagate/report distinctly from `submitLike`'s own success state.

**apps/api/src/app.controller.ts — same DB-bypasses-DI smell, new location (DEBT, judgement call)**
```ts
async getHealth(): Promise<HealthStatus> {
  await db.execute(sql`select 1`);
```
Round 1 logged DB-access-bypassing-DI only for `likes.controller.ts`. It also exists here — a second instance of the same smell (Shotgun Surgery risk: any future DI/testing change to DB access must touch both controllers). Worth folding into the same remediation, not a new class of problem.

**apps/api/entrypoint.sh — sharpens the known devDependencies DEBT (new info, not a new item)**
```sh
pnpm exec drizzle-kit migrate
exec node dist/main.js
```
`drizzle-kit` is a devDependency, invoked at container *runtime*, not build time. This means the already-logged "devDependencies ship in the runtime image" item isn't just wasted image size — it's load-bearing: migrations will break in production if someone naively prunes devDependencies with `--prod` to "fix" that debt. Flagging so remediation accounts for this (e.g., move `drizzle-kit` to `dependencies`, or run migrations as a separate build/init step) rather than a blind prod-install fix.

**Everything else checked clean**
- `.dockerignore` excludes `**/*.tsbuildinfo` — satisfies node-typescript-docker.md rule 1.
- `apps/api/tsconfig.build.json` sets `rootDir: "./src"` and excludes `drizzle.config.ts` — satisfies rule 2.
- DTOs, schema, likes.controller logic, docker-compose, nginx config — no standard violations or smells beyond what's already logged as DEBT (DI bypass, non-null assertion, multi-assertion test, stale checkboxes, `/health` scope, devDeps).

No new naming, comment, over-engineering, or test-boundary violations found beyond the above.

## Spec

All matches spec (migrations run at startup via entrypoint.sh, single compose command, no CORS since nginx proxies). No BLOCKs found from the spec axis.

**DEBT: Perpetual "loading…" state on count-fetch failure, alongside the new error banner**
`apps/web/app/page.tsx` — on `fetchCount()` failure, `error` is set but `count` stays `null` forever, so the UI shows both the new error alert *and* the button text stuck on `"loading…"` (`{count === null ? "loading…" : ...}`) with no retry path. Spec: "As a visitor, I want to see the current total like count when I load the page" — the new error path surfaces the failure (good, fixes the round-1 BLOCK) but leaves a contradictory/incomplete UI state rather than a clean error-only view. Minor, cosmetic.

**DEBT (not new): known round-1 items unchanged** — stale ticket checkboxes, `/health` endpoint as extra surface, devDependencies in Docker runtime images. Confirmed still present, no new information about them from this axis.

The new error-handling code in `apps/web/app/page.tsx` (the round-1 fix) correctly: checks `res.ok` in both `fetchCount` and `submitLike`, awaits `submitLike` from both `handleLikeClick` and `handleStorySubmit`, only clears/collapses the story form on success (leaving user input intact on failure so they don't lose their story), and surfaces a `role="alert"` message — matches spec's "confirmation the action worked" (story 3) and doesn't introduce scope creep. However, see the Standards axis for a genuine regression this same fix introduces (the `setError(null)` unconditional-clear bug).

Fresh full pass on the rest of the diff (controller, DTOs, schema, shared-types, nginx proxy, docker-compose, entrypoint migration step, test file) found nothing new beyond the three already-known round-1 DEBT items.

## Summary
BLOCK findings: 1
DEBT findings: 3 (1 new: app.controller.ts DI bypass; 1 new: "loading…" persists alongside error banner; 1 sharpened: entrypoint.sh depends on a devDependency at runtime)
Worst BLOCK: `apps/web/app/page.tsx` — a successful like/story POST followed by a failed count refetch has its error silently wiped by an unconditional `setError(null)`, reintroducing round 1's exact invisible-failure bug on a new path.

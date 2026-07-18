# Progress: thanks-claude

## Current phase
review

## Current ticket path
(none)

## Phases
- [x] grill (2026-07-18)
- [x] spec (2026-07-18)
- [x] tickets (2026-07-18)
- [x] implement/01-monorepo-scaffold (2026-07-18)
- [x] implement/02-like-count-api (2026-07-18)
- [x] implement/03-like-button-ui (2026-07-18)
- [x] review/round-1 (2026-07-18)
- [x] implement/review-round-1-tickets/01-frontend-network-error-handling (2026-07-18)
- [x] review/round-2 (2026-07-18)
- [x] implement/review-round-2-tickets/01-fix-error-clear-regression (2026-07-18)
- [x] review/round-3 (2026-07-18)

## Review rounds
- round-1 (2026-07-18): 1 BLOCK, 6 DEBT — see review/round-1/report.md. User decision: fix. Fix implemented same day.
- round-2 (2026-07-18): 1 BLOCK, 3 DEBT (2 new, 1 sharpened) — see review/round-2/report.md. User decision: escalate — continue to round 3 via review/round-2/tickets/01-fix-error-clear-regression.md.
- round-3 (2026-07-18): 0 BLOCK, 1 new DEBT (submitLike hidden side-effect on error/count state) — see review/round-3/report.md. All prior DEBT re-verified present, unchanged. User asked to address the round-3 DEBT item before archiving (outside formal ticket flow, since it wasn't a BLOCK); fixed same day, see tech-debt.md round-3 entry marked [FIXED]. Awaiting user decision on remaining (pre-existing) DEBT and archival.

## Last session end-state
After round-3 review completed with 0 BLOCKs, user asked to fix the new round-3 DEBT item before shipping. Fixed `apps/web/app/page.tsx`: `submitLike` no longer calls `fetchCount()` internally — it now only performs the POST, and `handleLikeClick`/`handleStorySubmit` each call `await fetchCount()` explicitly right after `submitLike()` succeeds (and, for the story path, after the form-reset state setters). This makes the side effect visible in caller code per the "does one thing"/"no invisible side effects" rule, closing the item identified as the root cause of the round-1 and round-2 bugs. Verified: `tsc --noEmit` clean; full `docker compose up --build` with in-browser checks via claude-in-chrome — happy-path like click (14→15, no error), `window.fetch` monkey-patch failing only `/api/likes/count` reproduced on both the like-click path (error shown, count stayed stale at 15, server-side confirmed POST succeeded raising real count to 16) and the story-submit path (form still collapsed, error persisted at stale count, server-side confirmed count reached 18), then restored fetch and confirmed recovery (stale 15 → 17 with error cleared). API test suite: 4/4 passing, unaffected (frontend-only change). Stack torn down (`docker compose down`) after verification. tech-debt.md's round-3 entry marked `[FIXED, 2026-07-18]` with the verification summary; the item is not removed, per the file's role as a log.

Review round-3 ran against `git diff HEAD` (no separate feature branch, consistent with rounds 1-2): 0 BLOCK findings. Standards sub-agent confirmed the round-2 fix is clean and traced all three flows (POST-fail, POST-succeeds/refetch-fails, full success) with no incorrect error-clearing. Spec sub-agent confirmed round-2's BLOCK is closed and the full contract remains present with no scope creep or wrong-implementation. One new DEBT logged: `submitLike` in `apps/web/app/page.tsx` violates "does one thing" / "no invisible side effects" since its `Promise<void>` signature hides that it also triggers `fetchCount()`, mutating `count`/`error` state — identified as the root cause behind both the round-1 and round-2 bugs. All prior-round DEBT items re-verified present and unchanged. Report at review/round-3/report.md; tech-debt.md updated with the round-3 section.

Since this is round 3 (beyond the standard 2-round limit) and there are 0 BLOCKs, the hard-gate escalate/accept/stop prompt does not apply — this falls under the "no BLOCKs remain" path instead. Presenting the plan-is-ready-to-ship checkpoint to the user now; awaiting their "done" reply to archive.

Round-2 fix ticket (01-fix-error-clear-regression) complete. Fixed `apps/web/app/page.tsx`: removed the unconditional `setError(null)` calls at the end of `handleLikeClick`'s and `handleStorySubmit`'s try blocks (the lines right after `await submitLike(...)` succeeded). `fetchCount` already manages `error` state correctly on its own (clears it on success, sets a message on failure), and `submitLike` calls `fetchCount()` internally after a successful POST — so the handlers' own `setError(null)` was redundant on the fully-successful path and actively harmful (stomping a fresh error) on the POST-succeeds-but-refetch-fails path. Removing it makes `fetchCount`'s own state management authoritative and closes the gap with no other behavior change (form-clear/collapse-on-success in `handleStorySubmit` is untouched, still gated on the POST succeeding).

Verified end-to-end: `tsc --noEmit` clean on `apps/web`; then a full `docker compose up --build` with real browser interaction (via claude-in-chrome). Happy path: Like click 10→11 likes, no error. Regression scenario simulated by overriding `window.fetch` in-page to reject only `/api/likes/count` requests (leaving `/api/likes` POSTs untouched) — this is a more precise tool than stop/start-ing the api container since it fails only the trailing GET, not the POST: clicking Like showed "Couldn't load the like count. Please refresh the page." and did NOT clear itself, while the UI count stayed stale at 11; cross-checked with the real (unpatched) fetch that the POST had in fact succeeded server-side (count was 12) — confirms this was genuinely the POST-succeeds/refetch-fails case, not a POST failure. Restored real fetch and clicked Like once more to confirm the happy path still clears a prior error and catches the count up (stale 11 → correct 13, no error shown). Repeated the failure scenario for the story path: reinstalled the fetch override, submitted a story — the box still collapsed (POST succeeded, server count became 14) but the error banner correctly persisted at the stale 13 display instead of being wiped. Restored real fetch afterward. Stack torn down after verification (`docker compose down`); no containers left running.

No new coding-rules gotchas.

Next: run review round-3 against `git diff HEAD` (no separate feature branch has been used all along). All prior DEBT items remain logged in review/tech-debt.md and untouched by this fix (out of scope for the BLOCK ticket).

Review round 1 (2026-07-18): 1 BLOCK, 6 DEBT — see review/round-1/report.md. User decision: fix — implemented same day. The 6 round-1 DEBT items remain logged in review/tech-debt.md and were not touched by this fix (out of scope for the BLOCK ticket).

Review round 2 (2026-07-18): ran both sub-agents against `git diff HEAD` again (still no separate feature branch). Findings:
- BLOCK: the round-1 fix itself has a regression — `apps/web/app/page.tsx`'s `handleLikeClick`/`handleStorySubmit` call `setError(null)` unconditionally after `submitLike` resolves, but `submitLike`'s internal `fetchCount()` call swallows its own failures without rethrowing. So a successful POST followed by a failed count-refetch silently wipes the error `fetchCount` just set — round 1's exact invisible-failure bug, reintroduced on a new path. Ticket written: review/round-2/tickets/01-fix-error-clear-regression.md.
- 3 DEBT items logged to review/tech-debt.md round-2 section: `app.controller.ts` has the same DB-bypasses-DI smell as `likes.controller.ts` (new location, same known issue); the devDependencies DEBT is sharpened — `entrypoint.sh` runs `drizzle-kit migrate` at container runtime, so it's load-bearing, not just image bloat, meaning a naive `--prod` prune would break migrations; and the "loading…" text persists forever alongside the new error banner on count-fetch failure (cosmetic).

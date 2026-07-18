# 01 — Stop a successful like/story submit from silently wiping a count-refetch error

**What to build:** `apps/web/app/page.tsx`'s `handleLikeClick` and `handleStorySubmit` both call `setError(null)` unconditionally right after `await submitLike(...)` resolves. `submitLike` itself calls `fetchCount()` at the end, and `fetchCount` swallows its own failures internally (sets `error` but never rethrows). So: POST succeeds, but the trailing GET /likes/count fails → `fetchCount` sets an error → `submitLike` still resolves normally (no throw) → the calling handler's success branch runs and immediately clears that same error with `setError(null)`. The visitor sees no error and a stale count, silently — this is round 1's exact bug, reintroduced on a new path.

**Blocked by:** review/round-1/tickets/01-frontend-network-error-handling (this is a regression in that fix)

**Status:** ready

- [ ] A successful `POST /likes` followed by a failing `GET /likes/count` results in a visible error to the visitor — it must not be silently cleared by the like/story handler's success path
- [ ] The fix does not simply remove the `setError(null)` calls if that would leave a stale error message showing after a fully successful like/story submit (POST + refetch both succeed) — a true full-success case must still clear any prior error
- [ ] No error is swallowed with an empty catch block or overwritten by an unrelated success path anywhere in this file
- [ ] Manually re-verified in a browser: with the API up, simulate the POST-succeeds-but-refetch-fails case (e.g. via a network throttling/blocking tool on just the count endpoint, or a brief mid-request container restart) and confirm the visitor sees an error rather than a silent stale count
- [ ] Manually re-verified in a browser: a fully successful like click (both POST and refetch succeed) still clears any previously shown error and updates the count normally — no regression to the happy path

# Review Round 2

## Standards

**Round-1 BLOCK fix verified: CLEAN.** `apps/web/app/page.tsx` diff confirmed — the old "ticket 06/07" WHAT-comment is gone, no replacement comment (WHAT or otherwise) was left in its place, and the rest of the file's changes are the actual redesign markup (SparkMark/StatsBand/StoryFeed insertion, footer) rather than stray edits. No regression.

### New findings

**apps/web/components/story-feed.tsx — `pageNumbers()`/`Pagination`** (DEBT, judgement call)
`pageNumbers` renders a button for every page (`Array.from({length: totalPages})`) with no windowing/ellipsis. With enough likes (e.g. >30 pages) this renders dozens-to-hundreds of buttons — a UX/perf smell distinct from round 1's "no shadcn primitive reused" item (that was about reuse; this is about the algorithm not scaling).

**apps/api/src/likes/likes.spec.ts — "orders likes by createdAt descending"** (DEBT)
Uses a real 10ms wall-clock `setTimeout` sleep between inserts to force ordering, rather than a deterministic mechanism (e.g. explicit `createdAt` values). Fragile, timing-dependent test — a Test smell not previously logged.

**apps/web/components/spark-mark.tsx — comments** (DEBT, judgement call)
Three separate comment blocks (module doc, interface doc, function doc) each re-assert "this is original, not a copy of Anthropic's logo." WHY-flavored (trademark-safety rationale), so not a flat WHAT-comment violation, but the same justification is duplicated three times over — mild Duplicated Code smell in comment form. Round 1 already flagged the spoke system itself as speculative generality; this is a separate observation about the comments.

**apps/api/src/likes/likes.controller.ts — `getPage`** (DEBT, judgement call, visibility only)
Builds the filter, runs two DB round-trips, and maps `createdAt` inline — the most complex method in the controller. Consistent with the file's existing no-service-layer convention (not a regression), but per the nestjs-service-style checklist this is the point where a `LikesService` becomes arguable. Not required by this ticket's scope.

### Confirmed correctly done
`likes-stats.util.ts` remains a correctly-extracted pure utility at the narrowest shared level. New DTOs follow existing conventions; `GetLikesQueryDto` validates page/limit at the boundary. No new occurrences of round 1's 8 already-logged DEBT items were made worse.

No new BLOCK-level issues found on the Standards axis.

## Spec

**Round-1 BLOCK fix (page.tsx comment removal): confirmed clean.** `git diff main -- apps/web/app/page.tsx` shows only structural/JSX changes — no leftover WHAT-style comments, and the like/story submission handlers, form fields, and mutation calls are byte-for-byte unchanged in logic. No regression or scope creep rode in with the fix.

### New spec-conformance issues

**(c) Implemented-but-wrong: feed cache invalidation only refreshes page 1, but insertion shifts every later page.**
`apps/web/lib/api-client/likes.ts`'s `onSuccess` invalidates only `likesFeedQueryKey(1)`, with a comment asserting "other pages don't shift in a way that needs an immediate refresh." Spec: *"immediately count toward the feed and stats after submission"* (Solution point 3) / User Story 8 (*"the stats band and feed to reflect my submission right away"*). Since pagination is offset-based and newest-first, inserting a row at the front shifts every subsequent page's window by one item — a visitor viewing page 2+ at submission time sees stale data (missing the item that shifted in), but that page's cache is never invalidated. The comment's premise is incorrect. **Tag: DEBT** — real correctness gap, narrow trigger (someone viewing page 2+ exactly when a new like/story lands), not exercised by the new e2e tests (which only check page 1).

**(a) Partial: stats band suppresses all four equally-weighted figures when totalLikes is 0.**
`apps/web/components/stats-band.tsx` replaces the whole 4-tile grid with "No likes yet — be the first to say thanks." when `totalLikes === 0`. Spec (User Stories 4/5) doesn't call for hiding the stats grid on zero; it's a defensible empty-state choice but is additional behavior not literally spec'd. **Tag: DEBT** — reasonable UX call, not a hard requirement violation, worth confirming intent.

### Nothing else new found
API zero-guarding, the Postgres `SUM` NULL handling, pagination/out-of-range behavior, the story-filter, `GetLikesQueryDto` bounds, and DTO/shared-type wiring all check out against the spec. `SparkMark` remains genuinely original (User Story 11); warm palette present in both `:root`/`.dark` (User Story 9). No unrelated files touched beyond the expected 7 new + 8 modified files.

No new BLOCK-level issues found on the Spec axis.

## Summary
BLOCK findings: 0
DEBT findings: 6 (4 Standards, 2 Spec)
Worst BLOCK: none — round 1's single BLOCK (WHAT-not-WHY comment in `apps/web/app/page.tsx`) is confirmed fixed cleanly with no regression.

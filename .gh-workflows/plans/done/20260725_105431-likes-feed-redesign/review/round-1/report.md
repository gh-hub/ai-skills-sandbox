# Review Round 1

## Standards

**apps/web/app/page.tsx** — the comment `/* Stats band (ticket 06) followed by the paginated story feed (ticket 07), per spec.md's hero → stats band → feed → footer ordering. */` describes WHAT is there / references ticket numbers, not a hidden invariant or WHY. Violates "no comments describing what the code does." **BLOCK** — delete or replace with a one-line WHY if one exists.

**apps/web/components/stats-band.tsx** + **apps/web/components/story-feed.tsx** — `formatNumber`/`formatHours` (`Number.isInteger(value) ? value.toString() : value.toFixed(1)`) is duplicated verbatim across both components, and again in `apps/e2e/tests/stats-band.spec.ts`. Duplicated Code smell. **DEBT** — extract to one shared formatting util (e.g. `lib/format.ts`).

Same two components also repeat an almost-identical `isError` → `isLoading` → `empty` → `data` conditional ladder. Real duplication, but only two call sites so far — extracting now risks a premature abstraction. **DEBT**, judgement call; revisit if a third async section appears.

**apps/web/components/spark-mark.tsx** — builds a generic polar-coordinate spoke-generation system (`SPOKES` array + trig) for a mark that is static, one-off, and only ever parameterized by `size`. Speculative generality for something that could be a fixed inline SVG. **DEBT**, judgement call (no functional issue, just avoidable machinery).

**apps/api/src/likes/likes.controller.ts** — `getStats`/`getPage` going straight to DB matches this module's established no-service-layer convention; `getPage`'s two queries + offset math + row mapping is borderline but not yet complex enough to force a services/ split — not flagged per established convention. Naming nit: `getPage` is less descriptive than sibling `getStats`/`getCount` (consider `getLikesPage`). **DEBT**, judgement call.

**apps/api/src/likes/likes-stats.util.ts** — correctly extracted (pure, no `this`/DI, narrowest shared directory, named by responsibility, named export). No violations.

**apps/api/src/likes/likes.spec.ts** — `"respects page and limit and reports correct total/totalPages"` asserts ~6 distinct facts (item length, total, totalPages, page, limit, plus a second request's cross-page-overlap check) in one test — violates "one assertion per test where possible" and mixes two scenarios (pagination shape vs. no-overlap). **DEBT** — split into two tests.

**docker-compose.yml** — adds `ports: ["5432:5432"]` exposing Postgres to the host; not called for by a likes-feed-redesign ticket. **DEBT**, scope-creep judgement call (may be intentional dev convenience — confirm with author).

**DTOs** (`get-likes-query.dto.ts`, `likes-page.dto.ts`, `likes-stats.dto.ts`) and `packages/shared-types` — clean, no findings.

## Spec

**(a) Missing / partial**

1. **DEBT** — Spec: *"packages/shared-types gains the corresponding request/response types."* Only response types (`LikesPage`, `LikesStats`) were added to `packages/shared-types/src/index.ts`. The existing convention already has a request type for the other endpoint (`CreateLikeRequest`), but no equivalent request type was added for the new `GET /likes?page=&limit=` query — `GetLikesQueryDto` lives only in the API and isn't mirrored in shared-types. Partial implementation of this line.

2. **DEBT** — Spec: *"Pagination controls (Prev/Next + page numbers): use the shadcn/ui pattern already established in this repo rather than a one-off implementation."* Checked `apps/web/components/ui/` — only `button.tsx, form.tsx, input.tsx, label.tsx, textarea.tsx` are installed; there is no shadcn `Pagination` primitive anywhere in the repo. `story-feed.tsx`'s `Pagination` component is a hand-rolled loop of raw `<Button>`s — i.e. exactly the "one-off implementation" the spec says to avoid, and no "already established" shadcn pattern actually exists to reuse. Either the spec's premise is stale or the ticket should have added the shadcn pagination component first.

**(b) Scope creep**

3. **DEBT** — `docker-compose.yml` diff adds:
```
+    ports:
+      - "5432:5432"
```
on the postgres service. This isn't mentioned anywhere in the spec, Implementation Decisions, or Out of Scope, and isn't needed by any listed requirement (API talks to the DB over the compose network already). It's an unrelated infra change (opens the DB port to the host) riding along in this plan's diff. (Same underlying change as the Standards-axis docker-compose item above — flagged from both angles, counted once in the summary.)

**(c) Looks implemented but wrong**

None found — the core aggregate math, filtering, and pagination logic all check out against spec:
- `computeLikesStats` correctly zero-guards both `percentWithoutHoursReported` and `averageHoursPerReport` per *"Both averageHoursPerReport and percentWithoutHoursReported are 0 when their denominator is 0."*
- `sum(likes.hoursSaved)` null-guarded (`reportedHoursSaved === null ? 0 : Number(...)`) per *"Postgres SUM-over-empty-set returning NULL, not 0."*
- `GET /likes` filter (`isNotNull` + `ne(story, "")`), `desc(createdAt)` ordering, and out-of-range-page behavior (empty items, correct total/totalPages, 200 not 4xx) all match spec and are covered by both unit and e2e tests.
- Equal-visual-weight stat tiles, spark-mark as inline SVG (not an asset), and warm palette in both `:root`/`.dark` all match.

No BLOCK-level findings.

## Summary
BLOCK findings: 1
DEBT findings: 8 (6 from Standards, 3 from Spec, with the docker-compose.yml port exposure counted once as a single finding flagged by both axes)
Worst BLOCK: `apps/web/app/page.tsx` has a WHAT-not-WHY comment above the stats-band/story-feed insertion point, violating the "no comments describing what the code does" rule.

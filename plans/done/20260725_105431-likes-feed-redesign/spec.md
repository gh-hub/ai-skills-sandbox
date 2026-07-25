# Spec: likes-feed-redesign

## Problem Statement

"Thanks, Claude" lets visitors like Claude and optionally attach a short story and an hours-saved number. Today those stories are write-only: once submitted, they vanish into the database and are never shown to anyone. There is also no honest, aggregate picture of impact across the whole like base — just a raw like count.

Separately, the page itself is a single minimal column styled with the unmodified default shadcn grayscale theme. It doesn't read as a polished, warm, "thank you" product page — it reads as a bare form.

Visitors have no reason to linger, no social proof that others have shared genuine stories, and no sense of the collective impact ("how many hours has Claude saved people like me?").

## Solution

1. Add a public, paginated feed of shared stories (10 per page, newest first, numbered pagination) so testimonials are actually shown back to visitors.
2. Add an honest stats band showing total likes, the literal reported hours-saved sum, an estimated total extrapolated across everyone (including non-reporters), and what fraction of likers didn't report a number — presented as equally-weighted figures, not a primary/secondary pair.
3. Restructure the page into a full landing-page layout — hero (headline + an original decorative "spark mark" SVG) → stats band → story feed → footer — in a warm, claude.com-inspired palette (cream/parchment backgrounds, terracotta/coral accent), replacing the current neutral grayscale theme in both light and dark mode. The existing like button, story form, and theme toggle keep working exactly as they do today, and immediately count toward the feed and stats after submission.

No literal Anthropic-owned logo, brand mark, or scraped image appears anywhere — only an original SVG inspired by the general look and feel.

## User Stories

1. As a visitor, I want to see a feed of stories other people have shared, so that I can read genuine testimonials about how Claude helped them.
2. As a visitor, I want to see hours saved on a story card when the author reported one, so I get a concrete sense of impact — and I don't want to see a fake "0" or placeholder when it wasn't reported.
3. As a visitor, I want to page through the story feed with numbered pagination (Prev/Next + page numbers), 10 stories per page, newest first, so I can browse deliberately rather than scroll an infinite list.
4. As a visitor, I want to see aggregate stats — total likes, reported hours saved, estimated total hours saved, and the percentage of likers who didn't report a number — so I get an honest, non-inflated picture of collective impact.
5. As a visitor, I want the reported and estimated hours-saved figures shown side by side with equal visual weight, so I'm not misled into treating one as more authoritative than the other.
6. As a visitor, I want to like Claude with a single click, exactly as today, so I can quickly show appreciation.
7. As a visitor, I want to optionally share a short story and an hours-saved number when I like, exactly as today, so my testimonial can appear in the feed.
8. As a visitor who just submitted a like or a story, I want the stats band and feed to reflect my submission right away, so the page feels responsive and honest about what it's showing.
9. As a visitor, I want light and dark mode to both work, using the existing theme toggle, so I can view the page comfortably regardless of system preference — and I want the new warm palette to look intentional in both modes, not like a dark mode that was forgotten.
10. As a visitor, I want the page to read as a real landing page (hero, stats, feed, footer) rather than a bare form, so the experience matches the warmth and polish the project is going for.
11. As a maintainer, I want no literal Anthropic-owned assets (logo, brand mark, scraped images) embedded anywhere in the app, so the project carries no trademark risk.
12. As a frontend developer, I want a paginated `GET /likes` endpoint that only returns likes with a non-empty story, ordered newest first, so I can render the feed without client-side filtering or sorting.
13. As a frontend developer, I want a `GET /likes/stats` endpoint that computes all aggregate figures server-side (including the divide-by-zero-safe cases), so the client never has to reimplement that math.
14. As a visitor browsing to a feed page with no stories yet (or past the last page), I want a clear empty state rather than a broken or blank layout.

## Implementation Decisions

**API (`apps/api/src/likes/`)**

- Extend the existing `LikesController` with two new read endpoints, added alongside the current `POST /likes` and `GET /likes/count` — neither existing endpoint changes behavior or contract.
  - `GET /likes?page={n}&limit={n}` — default `page=1`, `limit=10`. Filters to rows where `story` is non-null and non-empty. Orders by `createdAt` descending. Returns an envelope of `{ items, total, page, limit, totalPages }`, where each item is the existing `Like` shape (`id`, `createdAt`, `story`, `hoursSaved`).
  - `GET /likes/stats` — a single aggregate query over the `likes` table (no new table, no migration). Returns `totalLikes`, `likesWithHoursReported`, `reportedHoursSaved`, `percentWithoutHoursReported`, `averageHoursPerReport`, `estimatedTotalHoursSaved`, per the formulas in ADR-001. Both `averageHoursPerReport` and `percentWithoutHoursReported` are `0` when their denominator (`likesWithHoursReported` / `totalLikes` respectively) is `0` — this must not throw or return `NaN`/`Infinity`.
  - See `grill/ADR-001.md` for the full contract and rationale.
- New DTOs in `apps/api/src/likes/dto/` for the paginated feed response and the stats response, following the existing `LikeDto`/`LikeCountDto` pattern (implements a shared type, decorated with `@ApiProperty`).
- `packages/shared-types` gains the corresponding request/response types (a paginated-feed type and a stats type) alongside the existing `Like`, `LikeCount`, `CreateLikeRequest` types, so API and web share one source of truth.

**Web (`apps/web/`)**

- `app/page.tsx` is restructured from its current single-column form layout into a landing-page composition: hero section (headline + spark mark) → stats band → story feed → footer. The existing like button and story form remain functionally unchanged (same fields, same submit behavior) but are repositioned into the hero/CTA area of the new layout.
- New client hooks in `lib/api-client/likes.ts` alongside the existing `useLikeCount`/`useSubmitLike`: one for fetching a page of the story feed (parameterized by page number) and one for fetching stats, both following the existing `openapi-fetch` + TanStack Query pattern (typed via the generated `schema.d.ts`, errors thrown via the existing `throwApiError` helper).
- Cache invalidation: submitting a like or a story invalidates the like-count query key (as today) plus the feed and stats query keys, so the newly-submitted story/stats appear without a manual page refresh.
- The spark mark is an original, hand-built inline SVG React component (not a static asset) — there is currently no `public/` directory in `apps/web`, and an inline component avoids introducing one just for this. It takes inspiration from Claude's general aesthetic (radiating/star-like form) but is not a copy of any Anthropic asset.
- Theme: `app/globals.css` custom properties (`--background`, `--primary`, `--card`, etc.) are replaced with a warm palette (cream/parchment backgrounds, terracotta/coral primary accent) in both the `:root` block and the `.dark` block. The `next-themes`-driven toggle mechanism itself is unchanged — only the token values change.
- Pagination controls (Prev/Next + page numbers) are a new UI element; use the shadcn/ui pattern already established in this repo (Radix-based primitives, styled via the existing `components/ui/` conventions) rather than a one-off implementation.
- Empty/loading/error states for the feed and stats band follow the existing pattern in `page.tsx` (see `renderLikeCount`'s loading/error handling) — loading placeholder, retry affordance on error, explicit "no stories yet" state when a page has zero items.

**Out of scope for this decisions section but worth flagging for tickets:** exact spacing/typography/breakpoints and the precise visual form of the spark mark are visual-design details to finalize during implementation, not architectural decisions.

## Testing Decisions

- **API**: extend `apps/api/src/likes/likes.spec.ts`, which already spins up a real Postgres via `testcontainers` and drives the app through `supertest` against the real HTTP surface (prior art for `POST /likes` and `GET /likes/count`). Add equivalent integration-level tests for:
  - `GET /likes`: returns only likes with a non-empty story, newest first, respects `page`/`limit`, returns correct `total`/`totalPages`, and behaves sensibly for an out-of-range page (empty `items`, not an error).
  - `GET /likes/stats`: correct aggregate math against a known set of seeded likes, and the zero-denominator cases (`totalLikes = 0` and `likesWithHoursReported = 0`) return `0` rather than throwing or producing `NaN`/`Infinity`.
  - This is the highest available seam for the API (real HTTP request/response through the real controller and a real database), matching existing prior art — no lower-level unit seam is needed.
- **Web**: extend the Playwright suite in `apps/e2e/tests/` (prior art: `like-flow.spec.ts`, `story-form-flow.spec.ts`, `dark-mode-toggle.spec.ts`), which drives the real running app end-to-end. Add:
  - A feed test: submitting a story makes it appear in the feed (possibly after pagination/scroll to page 1, since it's newest-first), and stories without a story field do not appear.
  - A pagination test: navigating between feed pages via the Prev/Next/page-number controls shows different sets of stories.
  - A stats test: the stats band reflects submitted likes/stories (at minimum, that it renders the expected figures rather than erroring, given seeded/known data).
  - Extend or re-verify `dark-mode-toggle.spec.ts` so the redesigned page still toggles correctly under the new palette.
  - This is the highest available seam for the web app (real browser against the real running stack), matching existing prior art — no component-level/unit seam is needed for this feature.
- Test external behavior (HTTP responses, rendered DOM, user-visible interactions), not internal implementation details (query keys, hook internals, CSS variable names).

## Out of Scope

- Authentication or user accounts.
- Story moderation, profanity filtering, or any content moderation.
- Editing or deleting existing likes/stories.
- An admin panel or management UI.
- Search or keyword filtering within stories.
- Any new database table, column, or migration — both new endpoints are computed reads over the existing `likes` table.
- Infinite-scroll or load-more pagination patterns (explicitly rejected in favor of numbered pagination).
- Literal use of Anthropic's logo, brand assets, or scraped claude.com imagery.
- Pixel-perfect replication of claude.com — the redesign takes palette/typography/spacing inspiration only, not an exact clone.

## Further Notes

- **Open question**: exact behavior for `GET /likes?page=` beyond `totalPages` (e.g. `page=999` on a small dataset) is specified here as "return an empty `items` array with correct `total`/`totalPages`, not a 4xx" — this is a reasonable default inferred from ADR-001 rather than an explicit grill decision; flag to confirm during tickets/implementation if it matters.
- **Open question**: whether `limit` is client-configurable via query param or hardcoded to 10 server-side. ADR-001 shows `GET /likes?page={n}&limit={n}` with `limit` as a parameter, but the product decision (`grill/decisions.md`) fixes the feed at 10/page. Recommendation: accept `limit` as an optional query param for API flexibility/testability, but the web client always requests `limit=10` and the response caps/validates `limit` server-side (e.g. reasonable max) to avoid unbounded queries.
- **Risk**: the visual redesign touches nearly every visible pixel of the app (`globals.css` theme tokens, page structure, new components) in the same plan as new API/data-fetching work. Tickets should sequence the API additions and shared-types first, then the theme/token change, then the new layout/components — so each ticket has a working, testable increment rather than one giant UI ticket.
- **Risk**: `hoursSaved` is a nullable `numeric` column read via drizzle with `{ mode: "number" }`; aggregate SQL (`SUM`, `COUNT`) over it must be checked for driver-specific null/type coercion behavior (e.g. Postgres `SUM` over an empty set returns `NULL`, not `0`) when implementing `GET /likes/stats`.
- No new coding-rules file is anticipated for this plan; `nestjs-service-style` skill conventions apply to the new controller/DTO code as they did to the existing likes module.

# Spec: CLI Hero and Backend Restructure

This plan bundles two unrelated pieces of work at the user's explicit request: (A) a visual redesign of the "Thanks, Claude" homepage hero into a Claude-Code-CLI-styled bordered box (`apps/web`), and (B) a restructure of the API's `likes` feature into a repository/service/controller layering under `src/apps/likes/` (`apps/api`). They are kept separate below and will be kept separate in tickets, but live under this one plan folder per the user's request.

## Problem Statement

**A. Hero redesign.** A visitor landing on the "Thanks, Claude" appreciation site sees a generic marketing hero (spark logo, big heading, subtitle paragraph, Like button) that doesn't evoke the Claude Code CLI the site is about. The user wants the hero to look like the CLI's own splash screen — a bordered terminal window with a title bar and two-column layout — so the page's visual identity matches its subject matter.

**B. Backend restructure.** A developer working in `apps/api` finds the `likes` feature as a flat folder (`src/likes/`) whose controller (`LikesController`) does everything itself: it injects the DB client directly, writes raw Drizzle queries inline, and also performs business logic (ISO date conversion, pagination math, calling `computeLikesStats`) in the same methods that handle HTTP routing. This makes the controller hard to unit test in isolation and doesn't establish a repeatable pattern as more features are added to the API.

## Solution

### A. Hero redesign (apps/web)

Replace the current hero section in `apps/web/app/page.tsx` (the `<section>` currently containing `SparkMark`, the `<h1>`, and the subtitle `<p>`, roughly lines 87–97) with a single bordered, `font-mono`, CSS-built "terminal box" component styled with existing theme tokens (`border-border`, `bg-card`, `text-muted-foreground`, etc.):

- **Title bar**: the box's top area, containing the text "Thanks, Claude (code)". This text is the page's one and only `<h1>` — no separate hidden or visible heading exists elsewhere on the page.
- **Left column**: a "Welcome!" greeting, the existing `SparkMark` logo, a live stats line ("{likes} likes · {hours}h saved so far") sourced from `useLikesStats()` (already used by `StatsBand`), and a terminal-path-style tagline ("~/thanks-claude").
- **Right column**: a "Tips for saying thanks" header + tip copy, a divider, a "What's new" header + a blurb about sharing a story, and a closing line ("See stories below ↓") that anchor-links to the existing `#stats-and-feed` element.
- **Responsive behavior**: below the `sm` breakpoint, the two columns stack vertically (left column content above right column content) and the divider switches from vertical to horizontal.

The subtitle paragraph is deleted outright — its meaning is absorbed into the box's own copy. The Like button, like count display, and the expandable "Share a story" form remain exactly as they are today, functionally unchanged, positioned directly below the new box. `apps/e2e/tests/smoke.spec.ts` is updated so its heading assertion looks for "Thanks, Claude (code)" instead of "Thanks, Claude".

See `grill/ADR-001-hero-box-architecture.md` for the full rationale on CSS-vs-Unicode borders, the single-`<h1>` decision, and stack-vs-scroll responsive behavior.

### B. Backend restructure (apps/api)

Relocate everything under `apps/api/src/likes/` to `apps/api/src/apps/likes/`, and split the current controller's responsibilities across three files:

- **`likes.repository.ts`**: becomes the only file that imports `DATABASE_CONNECTION`/`DbClient` and the `likes` schema table for this feature, and the only place that issues Drizzle queries (the insert in `create`, the counts/sum in `getStats`, the count+select in `getPage`). It returns raw DB rows (e.g. rows with `createdAt` still a `Date`, raw aggregate numbers) with no shaping or business logic.
- **`likes.service.ts`**: owns everything that is currently business logic inside the controller — converting `createdAt` to ISO strings, pagination math (`totalPages`, `offset`), normalizing `reportedHoursSaved` from `sum()`'s nullable result, and calling `computeLikesStats`. It calls the repository for data and is what the controller calls.
- **`likes.controller.ts`**: becomes a thin HTTP layer — routes (`@Controller("likes")`, `@Post()`, `@Get("count")`, `@Get("stats")`, `@Get()`), Swagger decorators, DTO binding — delegating every method body to the corresponding service call and returning its result. No DB imports, no business-logic computation.
- **`likes.module.ts`**: registers `LikesController`, `LikesService`, and `LikesRepository` as providers (still importing `DbModule`).
- **`likes-stats.util.ts`** (the pure `computeLikesStats` function) relocates alongside the feature unchanged in role, called from `likes.service.ts` only.
- The `dto/` folder (`create-like.dto.ts`, `get-likes-query.dto.ts`, `like.dto.ts`, `likes-page.dto.ts`, `likes-stats.dto.ts`) relocates as-is, with import paths updated for the new depth (e.g. `../db/db.module` becomes `../../db/db.module` from `src/apps/likes/`).
- `likes.spec.ts` (the testcontainers + supertest integration test) relocates into the new folder unchanged in behavior.

Root-level bootstrap files (`main.ts`, `app.module.ts`, `app.controller.ts`, `db/`, `generate-openapi.ts`) stay at `src/` root exactly as they are today; `app.module.ts`'s import of `LikesModule` is updated to the new path (`./apps/likes/likes.module`), and any other file that imports something from the old `src/likes/*` path is updated to the new location.

See `grill/ADR-002-service-repository-layering.md` for the full rationale on the `src/apps/{feature}/` namespace and the repository/service/controller dependency direction.

## User Stories

1. As a visitor to the "Thanks, Claude" site, I want the top of the page to look like a Claude Code terminal window, so that the page's design reflects what the site is about.
2. As a visitor using a screen reader, I want exactly one `<h1>` on the page whose text matches what I see in the title bar, so that the page's heading structure stays simple and unambiguous.
3. As a visitor on a narrow (mobile) viewport, I want the box's two columns to stack vertically with a horizontal divider instead of forcing me to scroll sideways, so that I can read all the box's content comfortably.
4. As a visitor, I want to see the live like count and hours-saved figure inside the hero box, so that I get an immediate sense of the project's impact before scrolling further.
5. As a visitor, I want the Like button, like count, and "Share a story" form to keep working exactly as before, so that the redesign doesn't disrupt the site's core interaction.
6. As a visitor in dark mode, I want the hero box to render correctly with proper contrast, so that the redesign doesn't look broken outside of light mode.
7. As a developer maintaining `apps/e2e`, I want the smoke test's heading assertion to match the new `<h1>` text, so that the existing smoke test continues to validate the real page instead of failing on stale copy.
8. As a developer working in `apps/api`, I want the `likes` feature organized under `src/apps/likes/` with a repository/service/controller split, so that DB access, business logic, and HTTP routing are each isolated and independently testable.
9. As a developer adding a new feature to `apps/api` in the future, I want `likes` to demonstrate the `src/apps/{feature}/` + repository/service/controller pattern, so that I have a concrete precedent to follow rather than inventing an organization from scratch.
10. As a developer debugging a failing test, I want isolated unit tests for `likes.service.ts` (repository mocked) and `likes.repository.ts` (DB client mocked), so that a failure points at the specific layer responsible rather than only surfacing through the end-to-end integration test.
11. As a developer relying on the API, I want the HTTP contract (routes, request/response shapes) to be completely unchanged by this restructure, so that no client code (including `apps/web`'s generated API client) needs to change.

## Implementation Decisions

### A. Hero redesign

- The hero box replaces the current `<section>` containing `SparkMark` + `<h1>` + subtitle `<p>` in `apps/web/app/page.tsx`; the Like button/count block and the "Share a story" expandable form stay as their own elements directly below the box, unchanged in markup/behavior.
- The box is a bordered container using existing theme tokens (`border-border`, `bg-card`, small border-radius) and `font-mono` for its interior text — no new CSS custom properties, no new Tailwind config, no new dependencies.
- The title bar's text is the literal `<h1>` element (not a separate visual label next to a hidden heading) per ADR-001; its styling is bespoke to fit the title-bar visual slot rather than reusing a generic heading style.
- The stats line consumes `useLikesStats()` (already imported by `StatsBand` from `@/lib/api-client/likes`) and renders "{likes} likes · {hours}h saved so far", using `totalLikes` and `estimatedTotalHoursSaved` from the existing `LikesStats` shape; it should handle the hook's loading/error states reasonably (e.g. a loading placeholder), consistent with how `StatsBand` and the existing like-count renderer already handle `useQuery` states — no new stats endpoint or hook is introduced.
- The right column's closing line links via a same-page anchor to `#stats-and-feed` (the existing wrapping `<div>` around `StatsBand`/`StoryFeed`), so "See stories below ↓" scrolls to the existing feed section.
- Two-column layout is CSS Grid or Flexbox with a `sm`-breakpoint responsive switch (stack + divider reorientation), matching the project's existing Tailwind breakpoint usage elsewhere on the page (`sm:py-28`, `sm:text-5xl`, etc.).
- No new page route, no new component library — this can live as markup within `apps/web/app/page.tsx`, optionally factored into a local component if that reduces duplication, but no shared/reusable extraction is required now (ADR-001 explicitly defers that).
- `apps/e2e/tests/smoke.spec.ts`'s `getByRole("heading", { name: "Thanks, Claude" })` assertion is updated to `"Thanks, Claude (code)"`.

### B. Backend restructure

- New directory: `apps/api/src/apps/likes/` containing `likes.controller.ts`, `likes.service.ts`, `likes.repository.ts`, `likes.module.ts`, `likes-stats.util.ts`, `likes.spec.ts`, and `dto/` (all five existing DTO files). The old `apps/api/src/likes/` directory is deleted once relocated.
- `likes.repository.ts` exposes methods the service needs at the granularity the controller currently calls the DB at — e.g. something like `insertLike(...)`, `countAll()`, `getStatsAggregate()`, `countWithStory()`, `getStoryPage(limit, offset)` (exact method names are an implementation detail for the tickets phase) — each doing exactly one Drizzle query and returning raw rows/values, no shaping.
- `likes.service.ts` exposes methods matching the controller's current public operations (create, get count, get stats, get paginated story page), performing all the shaping (ISO date conversion, `totalPages` calculation, `offset` calculation, null-coalescing `sum()`'s result, calling `computeLikesStats`) using data from the repository.
- `likes.controller.ts` keeps its existing decorators (`@Controller("likes")`, `@Post()`, `@Get("count")`, `@Get("stats")`, `@Get()`), Swagger annotations, and DTO bindings unchanged; each method body becomes a single delegating call into the service.
- `likes.module.ts` imports `DbModule` (path updated to `../../db/db.module`) and registers `[LikesController]` / providers `[LikesService, LikesRepository]`.
- `apps/api/src/app.module.ts`'s `LikesModule` import path changes from `./likes/likes.module` to `./apps/likes/likes.module`; no other change to `app.module.ts`, `app.controller.ts`, `main.ts`, `db/`, or `generate-openapi.ts` beyond import-path fixes strictly required by the move.
- No change to any DTO's shape, decorators, or exported types, and no change to `likes-stats.util.ts`'s implementation — only their file location and relative imports.
- No change to the HTTP contract: same routes, same request/response shapes, same status codes. `apps/web`'s generated OpenAPI client output is expected to be unaffected since the contract doesn't change (`generate-openapi.ts` itself doesn't move and isn't touched beyond any import-path fix it might need, per the "Done when" in requirements).

## Testing Decisions

### A. Hero redesign

- Prior art: `apps/e2e/tests/smoke.spec.ts` already asserts on the page's `<h1>` heading via Playwright's `getByRole("heading", ...)`. This is the existing, highest test seam for "the page renders with the right heading" and is updated in place rather than adding a parallel test.
- No new component-level unit tests are required for the box markup itself — this is presentation-only, existing-token-driven UI. The stats line's data comes from `useLikesStats()`, which is already exercised indirectly by any existing tests around `StatsBand`/the API client; no new data-fetching logic is introduced.
- Manual/visual verification (light + dark theme, `sm` breakpoint stacking) is expected during implementation since there is no existing visual-regression tooling in this repo to hook into; this is not a gap to fill as part of this plan.

### B. Backend restructure

- Prior art: `likes.spec.ts` is the existing integration test seam — testcontainers-backed Postgres + supertest against real HTTP endpoints via a full `AppModule`. It relocates unchanged and continues to be the primary contract-level regression test for the whole feature (repository + service + controller together, through real HTTP).
- New unit test for `likes.service.ts`: mock `LikesRepository` (e.g. via a hand-built mock object or Nest's testing module with an overridden provider) and assert the service produces correctly-shaped output (ISO date strings, correct `totalPages`/`offset` math, correct `computeLikesStats` inputs/outputs) from given raw repository return values — this is the highest seam for pinpointing business-logic regressions without needing a real DB.
- New unit test for `likes.repository.ts`: mock the `DbClient` (the Drizzle client shape) and assert each repository method issues the expected query pattern and returns the DB client's raw result unmodified — the highest seam for pinpointing DB-access regressions in isolation from business logic.
- These new unit tests should follow this project's `nestjs-service-style` skill conventions for structuring services/controllers/tests where applicable (e.g. thin-controller, focused-service guidance already referenced in ADR-002).
- No new integration test is needed beyond the relocated `likes.spec.ts` — the HTTP contract isn't changing, so its existing assertions remain valid as-is.

## Out of Scope

- Restructuring any other `apps/api` feature besides `likes` — no other feature apps exist yet, so there is nothing else to migrate under `src/apps/` in this plan.
- Any further product/design changes to the hero box's copy or visual style beyond what's specified in `grill/decisions.md` and `grill/requirements.md` — additional wording/design changes need a separate product decision.
- Any functional change to the Like button, like count, or "Share a story" form — they are relocated visually (staying in the same place, below the box) but not modified in behavior.
- New fonts, dependencies, or design-system tokens for the hero box — it reuses `font-mono` and existing theme tokens only.
- Any change to the HTTP API contract (routes, request/response shapes, status codes) as part of the backend restructure.
- Any change to `apps/api` root bootstrap files (`main.ts`, `app.module.ts`, `app.controller.ts`, `db/`, `generate-openapi.ts`) beyond the import-path fix strictly needed for the `likes` move.
- Extracting the hero box into a shared/reusable component — ADR-001 explicitly scopes it to this one page for now.

## Further Notes

- **Open question (resolved by reasonable default): exact repository/service method names and signatures.** The grill/decisions and ADR-002 specify the layering and responsibilities precisely but not exact method names. This spec proposes plausible names (`insertLike`, `countAll`, `getStatsAggregate`, `countWithStory`, `getStoryPage`, etc.) as a sketch; the tickets phase should finalize exact names/signatures as an implementation detail — this does not change scope or behavior.
- **Open question (resolved by reasonable default): whether the hero box is a separate component file or inline JSX.** Neither the grill output nor the ADRs mandate extraction into its own component. Given ADR-001's note that shared-component extraction is explicitly deferred, this spec allows either inline JSX within `page.tsx` or a same-plan-local component file — whichever keeps `page.tsx` readable — as a tickets-phase implementation detail, not a product decision.
- **Risk**: The stats line's copy ("{likes} likes · {hours}h saved so far") needs a loading/placeholder state, since `useLikesStats()` is asynchronous; this spec assumes a simple inline loading treatment consistent with the existing like-count renderer in `page.tsx`, but the exact placeholder text is left to implementation.
- **Risk**: Because `likes.spec.ts` boots `AppModule` via dynamic `import("../app.module")`, relocating the test file changes its relative import depth to `app.module`/`db/db.module` — this must be updated correctly or the integration test will fail to resolve modules; this is a mechanical fix, not a design question.

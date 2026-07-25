# Decisions

## Decision: CSS-built box, not Unicode box-drawing characters
Decided: The hero box's border is built with real CSS (a bordered `<div>`, small border-radius, 1px border using existing theme tokens like `border-border`/`bg-card`), not literal Unicode box-drawing characters (`╭─╮│╰─╯`).
Why: Literal box-drawing characters are fragile/brittle at responsive widths; CSS borders reflow cleanly at any viewport width while still reading visually as a terminal window.
Alternatives rejected: Literal Unicode box-drawing characters to exactly mirror the CLI mockup's text art.

## Decision: System monospace via `font-mono`
Decided: Text inside the box uses Tailwind's built-in `font-mono` utility (system monospace stack — ui-monospace/SF Mono/Menlo/Consolas).
Why: Achieves the terminal look with no new web font, no new dependency, and no font-loading cost.
Alternatives rejected: None (no alternative fonts were considered).

## Decision: Title-bar text is the page's single `<h1>`
Decided: The box has a title-bar area (visually analogous to the mockup's `╭─── Claude Code v2.1.220 ───╮` embedded title) containing the text "Thanks, Claude (code)". This text IS the page's `<h1>` — there is no separate standalone big H1 heading elsewhere.
Why: Keeps exactly one `<h1>` on the page for accessibility while achieving the visual design.
Alternatives rejected: A separate visually-hidden `sr-only` h1 elsewhere plus a plain styled span for the title bar — rejected as unnecessary duplication when the title bar text can just be the real heading.

## Decision: Two-column content mapped from the CLI mockup
Decided: Left column holds a non-personalized "Welcome!" greeting, the existing `SparkMark` logo, a live stats line ("{likes} likes · {hours}h saved so far") sourced from `useLikesStats()`, and a terminal-path-style tagline ("~/thanks-claude"). Right column holds a "Tips for saying thanks" header + tip line, a divider, a "What's new" header + share-a-story blurb, and a closing "See stories below ↓" line anchor-linking to the existing `#stats-and-feed` element.
Why: Maps the site's existing content (which has no auth/user accounts, unlike the CLI's personalized "Welcome back gil!") onto the CLI mockup's structure as closely as sense allows.
Alternatives rejected: None — this copy was drafted and explicitly approved by the user as-is ("approve as drafted"); wording may be polished slightly during spec/tickets but structure and tone stay.

## Decision: Columns stack vertically below `sm`
Decided: Below a breakpoint (e.g. `sm`), the two columns stack vertically (left column content above right column content), and the vertical divider between columns becomes a horizontal one.
Why: Better mobile UX than the alternative.
Alternatives rejected: Keeping the fixed two-column layout and letting the box scroll horizontally on mobile — rejected for worse mobile UX.

## Decision: Remove the existing subtitle paragraph
Decided: The existing subtitle paragraph ("A small way to say thank you — and to see how much time Claude has given back to people like you.") is removed entirely.
Why: Its context is now carried by the box's own copy, making it redundant.
Alternatives rejected: None.

## Decision: Like button and story form stay unchanged, outside the box
Decided: The existing Like button + count and the expandable "Share a story" form/button are unchanged and stay exactly where they are today — directly below the new box.
Why: The box is a purely decorative/branded header; no functional elements move into it.
Alternatives rejected: None.

## Decision: Reuse existing theme tokens for light/dark support
Decided: The box must support both light and dark theme via the existing Tailwind/shadcn theme tokens already used elsewhere in the file (`border-border`, `bg-card`, `text-muted-foreground`, etc.) — no new theming work.
Why: Consistency with the rest of the site and no added theming cost.
Alternatives rejected: None.

## Decision: Update the e2e smoke test's heading assertion
Decided: `apps/e2e/tests/smoke.spec.ts` line 6 (which asserts `page.getByRole("heading", { name: "Thanks, Claude" })`) is updated to expect `"Thanks, Claude (code)"` in the same plan.
Why: The h1 text is changing as part of the redesign; the smoke test is a known consumer that would otherwise break.
Alternatives rejected: None.

## Decision: Only `likes` moves under `src/apps/`, root bootstrap stays put
Decided: Only feature modules move under `src/apps/` — starting with `src/apps/likes/` (relocating everything currently in `src/likes/`). Root-level bootstrap files (`main.ts`, `app.module.ts`, `app.controller.ts`, `db/`, `generate-openapi.ts`) stay exactly where they are at `src/` root.
Why: Those root files are NestJS app bootstrap/shared infrastructure, not a feature app.
Alternatives rejected: Moving everything (including `app.module.ts`/`app.controller.ts` as a "root app", and `db/` as a "shared app") under `src/apps/` — rejected as unnecessary since those aren't feature apps.

## Decision: Repository/service/controller responsibility split
Decided: `likes.repository.ts` becomes the only place that imports `DbClient`/`DATABASE_CONNECTION`/the `likes` schema table and issues raw Drizzle queries; it returns raw DB rows with no business logic. `likes.service.ts` calls the repository and owns all business logic currently inline in the controller (ISO date conversion, pagination math, calling `computeLikesStats`). `likes.controller.ts` becomes thin — routing/HTTP concerns only, calling into the service and nothing else.
Why: Aligns with the project's `nestjs-service-style` skill ("keep controllers thin", "prefer focused services") plus the user's explicit additional repository layer on top of that baseline.
Alternatives rejected: None — this is an explicit ask, not a derived convention.

## Decision: `likes-stats.util.ts` stays a util, relocates alongside the feature
Decided: `likes-stats.util.ts` (the pure `computeLikesStats` function) stays a util per existing convention, just relocates alongside the rest of the feature; it is called from `likes.service.ts`, not from the repository or controller.
Why: Already correctly separated per the project's `nestjs-service-style` skill conventions — no reason to change its role, only its location.
Alternatives rejected: None.

## Decision: DTOs and module relocate as-is, imports updated
Decided: DTOs (`dto/create-like.dto.ts`, `get-likes-query.dto.ts`, `like.dto.ts`, `likes-page.dto.ts`, `likes-stats.dto.ts`) and `likes.module.ts` relocate as-is under the new folder, updated only for new relative import paths (e.g. `../db/db.module` becomes a deeper relative path from `src/apps/likes/`).
Why: No behavior change needed in the DTOs themselves — only their location.
Alternatives rejected: None.

## Decision: Module registers new providers
Decided: `likes.module.ts` needs to register the new `LikesService` and `LikesRepository` as providers (in addition to the existing `LikesController`) so Nest's DI can inject them.
Why: Required for the new service/repository classes to be constructible via Nest's dependency injection.
Alternatives rejected: None.

## Decision: Relocate integration test as-is, plus add new unit tests
Decided: The existing `likes.spec.ts` (integration test using testcontainers + supertest hitting real HTTP endpoints) relocates as-is into the new folder with no behavior changes. In addition, new focused unit tests are written for `likes.service.ts` and `likes.repository.ts` in isolation (mocking the repository when testing the service; mocking the DbClient when testing the repository).
Why: The integration test already exercises service+repository+controller together through the real HTTP layer, so relocating it loses no coverage. The new unit tests are an explicit additional ask from the user, not incidental scope creep, to get isolated coverage of the new layers.
Alternatives rejected: None.

## Decision: Only `likes` is restructured now; pattern is precedent for later
Decided: This restructure establishes the pattern/precedent for future feature apps in this API, but only the `likes` feature exists today, so only `likes` is being restructured in this plan.
Why: No other feature apps exist yet to migrate.
Alternatives rejected: None.

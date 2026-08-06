# Requirements: CLI Hero + Backend Restructure

This plan bundles two unrelated pieces of work, at the user's request, into a single plan.

## Problem

**A. Hero redesign.** The top of the "Thanks, Claude" appreciation site (`apps/web`) currently looks like a generic marketing hero: an icon, a big heading, a subtitle, and a Like button. The user wants it redesigned to look like the Claude Code CLI's own splash screen — the bordered terminal-window box with a title bar and a two-column layout that people see when they start a Claude Code session.

**B. Backend restructure.** The NestJS API (`apps/api`) currently organizes each feature as a flat folder under `src/` (e.g. `src/likes/`), and the controller does everything itself — it injects the DB client directly and runs queries inline, alongside response-shaping and business logic. The user wants features organized under `src/apps/{feature}/`, with a clean split: a repository for DB access, a service for business logic, and a thin controller for HTTP routing only. This establishes the pattern the API will follow going forward.

## Solution

### A. Hero redesign (apps/web)

Replace the existing hero section (icon, `<h1>`, subtitle paragraph) with a bordered, terminal-style box built with real CSS (not Unicode box-drawing characters), styled with the system monospace font, containing:
- A title bar whose text ("Thanks, Claude (code)") is the page's single `<h1>`.
- A left column: a "Welcome!" greeting, the existing spark-mark logo, a live stats line sourced from the existing likes stats data, and a terminal-path-style tagline ("~/thanks-claude").
- A right column: tips for saying thanks, a divider, a "what's new" blurb about sharing a story, and a link down to the story feed.
- On narrow viewports, the two columns stack vertically with the divider switching from vertical to horizontal.
- Full support for both light and dark theme using the site's existing design tokens.

The existing Like button, like count, and "Share a story" form are unchanged and remain directly below the new box. The old subtitle paragraph is removed — its meaning is now carried by the box's own copy.

**Done when:**
- The hero section renders as a bordered box with a title bar and two-column layout matching the agreed structure, in both light and dark theme.
- The page has exactly one `<h1>`, and its text is the title-bar text ("Thanks, Claude (code)").
- The two columns stack correctly (with the divider reorienting) below the `sm` breakpoint.
- The live stats line in the left column reflects real data from the existing likes-stats hook.
- The Like button, like count, and Share-a-story form still work exactly as before, unchanged, below the box.
- `apps/e2e/tests/smoke.spec.ts` is updated to look for the new heading text and the smoke test passes.

### B. Backend restructure (apps/api)

Move the `likes` feature from `src/likes/` to `src/apps/likes/`, and split its logic:
- `likes.repository.ts` — the only place that touches the DB client/schema/raw Drizzle queries; returns raw rows, no business logic.
- `likes.service.ts` — owns all business logic (date formatting, pagination math, calling the existing `computeLikesStats` util), calling the repository for data.
- `likes.controller.ts` — thin HTTP layer only: decorators, DTOs, delegates to the service.
- `likes.module.ts` registers the controller, service, and repository as providers.
- DTOs and the existing `likes-stats.util.ts` relocate alongside, with import paths updated.

Root-level bootstrap files (`main.ts`, `app.module.ts`, `app.controller.ts`, `db/`, `generate-openapi.ts`) are infrastructure, not a feature app, and stay at `src/` root.

**Done when:**
- `src/apps/likes/` exists with `likes.controller.ts`, `likes.service.ts`, `likes.repository.ts`, `likes.module.ts`, `likes-stats.util.ts`, and `dto/`, and `src/likes/` no longer exists.
- The controller contains no direct DB access and no business logic — only routing/HTTP concerns.
- The repository contains no business logic — only DB access, returning raw rows.
- The service contains all business logic previously in the controller.
- The existing integration test (`likes.spec.ts`) relocates and continues to pass unchanged in behavior.
- New unit tests exist for `likes.service.ts` (repository mocked) and `likes.repository.ts` (DB client mocked).
- The app builds, boots, and all existing API behavior is unchanged from the outside (same HTTP contract).

## Out of scope

- No other feature apps in `apps/api` are restructured in this plan — only `likes`. The pattern is established here for future features to follow, not applied elsewhere yet.
- No new copy, design, or content beyond what's specified in this plan's decisions — any further wording/design changes to the hero box need a separate product decision.
- No changes to the Like button, like count, or "Share a story" form's behavior — they are relocated visually (staying in place) but not modified functionally.
- No new fonts, dependencies, or design-system tokens are introduced — the hero box reuses `font-mono` and existing theme tokens only.
- No change to the HTTP API contract (routes, request/response shapes) as part of the backend restructure — this is an internal code-organization change only.
- No changes to `apps/api` root bootstrap files (`main.ts`, `app.module.ts`, `app.controller.ts`, `db/`, `generate-openapi.ts`) beyond what's strictly needed if any import paths shift.

# Spec: UI Component Decomposition

## Problem Statement

Three files in `apps/web` have grown into multi-component modules: `apps/web/components/story-feed.tsx` (214 lines, 7 functions/types), `apps/web/app/awards/page.tsx` (215 lines, 6 functions/types), and `apps/web/app/page.tsx` (384 lines, 6 functions/types plus the page component). Each file already has its logic cleanly separated into distinct named functions and components — the components themselves are not tangled — but all of them are bundled into one file per page/feature. This is out of step with the rest of `apps/web/components/`, which already follows a flat one-file-per-component convention (e.g. `user-avatar.tsx`, `stats-band.tsx`, `spark-mark.tsx` each hold exactly one exported component, sometimes with one small private helper). The size and multi-component nature of these three files makes them harder to navigate, harder to review in isolated diffs, and harder to reuse a single piece from without pulling in unrelated code.

## Solution

Split each of the three files into one file per already-existing component/helper, moved into the existing flat `apps/web/components/` directory as new sibling files, following the same conventions already used there (kebab-case filenames, named exports matching the component name, e.g. `export function StoryCard()`). This is a pure extraction and import-rewiring exercise — no new component boundaries are invented beyond what already exists as separate named functions today, no props or behavior change, and no per-feature subfolders. Each of the three original files shrinks down to just its top-level entry component (`StoryFeed`, `AwardsPage`, `Home`) — plus, for `page.tsx`, the small inline render helpers and form schema that are intentionally kept in place (see Implementation Decisions). When done, the app builds, typechecks, and renders identically on all three pages; only file boundaries changed.

## User Stories

1. As a developer, I want each component in its own file, so that I can find and review it quickly without scrolling through unrelated components in the same module.
2. As a developer reviewing a pull request, I want a change to `StoryCard` to show up as a diff to `story-card.tsx` alone, so that the diff isn't cluttered with unrelated components that happen to live in the same file.
3. As a developer, I want the extracted files to follow the same flat, kebab-case, named-export convention already used in `apps/web/components/` (e.g. `user-avatar.tsx`, `stats-band.tsx`), so that the codebase's file layout stays consistent and predictable.
4. As a developer, I want a component that's currently buried inside `story-feed.tsx`, `awards/page.tsx`, or `page.tsx` to become independently importable, so that I can reuse it elsewhere without importing the whole parent module.
5. As a developer, I want this refactor to introduce zero behavior, prop, or visual changes, so that I can trust the diff is safe to merge without re-testing application behavior from scratch.

## Implementation Decisions

This is a pure file-split refactor. No new component boundaries beyond what is already separated as named functions/components in the three source files today. No prop signature changes. No API contract changes. No per-feature subfolders — all new files land as flat siblings directly in `apps/web/components/`, matching the existing convention. All extracted components/functions keep their existing named-export form (e.g. `export function AwardBadge()`), matching the codebase's existing `export function StoryFeed()` style; page entry points (`AwardsPage`, `Home`) keep their existing default export.

**`apps/web/components/story-feed.tsx`** keeps only `StoryFeed` (the exported entry component). New sibling files in `apps/web/components/`:
- `award-badge.tsx` — `AwardBadge`, `AwardBadgeList`, and the `StoryAward` type, exported so `story-card.tsx` can import it.
- `story-byline.tsx` — `StoryByline`.
- `story-card.tsx` — `StoryCard`, with `formatHours` co-located as its sole private helper; imports `AwardBadgeList`/`StoryAward` from `award-badge.tsx` and `StoryByline` from `story-byline.tsx`.
- `feed-skeleton.tsx` — `FeedSkeleton`.
- `pagination.tsx` — `Pagination`, with `pageNumbers` co-located as its sole private helper.

`StoryFeed` in `story-feed.tsx` imports `StoryCard`, `FeedSkeleton`, and `Pagination` from their new files, plus continues its existing imports (`useLikesFeed`, `UserAvatar` no longer needed directly since it now lives inside `story-byline.tsx`, etc. — each new file carries only the imports it actually uses).

**`apps/web/app/awards/page.tsx`** keeps only `AwardsPage` (default export). New sibling files in `apps/web/components/`:
- `awards-list.tsx` — `AwardsListSkeleton` and `AwardsList`.
- `create-award-form.tsx` — `CreateAwardForm`, with `createAwardSchema`/`CreateAwardValues` co-located as its sole private/local usage.
- `login-prompt.tsx` — `LoginPrompt`.
- `create-award-section.tsx` — `CreateAwardSection`, importing `LoginPrompt` from `login-prompt.tsx` and `CreateAwardForm` from `create-award-form.tsx`.

`AwardsPage` imports `AwardsList` from `awards-list.tsx` and `CreateAwardSection` from `create-award-section.tsx`.

**`apps/web/app/page.tsx`** keeps `Home` (default export), the `storyFormSchema`/`StoryFormValues` form schema, and the three inline render helpers `renderLikeCount`, `renderHeroStatsLine`, and `formatHeroStatNumber` — these stay in `page.tsx` per the grill decision below. New sibling files in `apps/web/components/`:
- `header-auth-control.tsx` — `HeaderAuthControl`.
- `award-checkbox-list.tsx` — `AwardCheckboxList`, with `toggleAwardId` co-located as its sole private helper.

`Home` imports `HeaderAuthControl` and `AwardCheckboxList` from their new files, alongside its existing imports.

**Why the render helpers stay in `page.tsx`** (carried over from `grill/decisions.md`): `renderLikeCount`, `renderHeroStatsLine`, and `formatHeroStatNumber` are small formatting/render-branch helpers invoked as plain function calls inline within `Home`'s JSX (e.g. `{renderLikeCount(likeCount)}`), not JSX components invoked as `<Tag/>`. Extracting them would go beyond "pure file split" into inventing new decomposition, which is explicitly out of scope for this pass.

**Why helpers co-locate rather than get their own file** (carried over from `grill/decisions.md`): a helper used by exactly one extracted component moves into that component's new file instead of getting a one-line file of its own — applies to `formatHours` (→ `story-card.tsx`), `pageNumbers` (→ `pagination.tsx`), `toggleAwardId` (→ `award-checkbox-list.tsx`), and `createAwardSchema`/`CreateAwardValues` (→ `create-award-form.tsx`). This avoids an explosion of trivial single-purpose files, since a helper and its sole consumer are one conceptual unit.

**Import wiring**: every new file imports only what it actually uses (e.g. `story-byline.tsx` needs `UserAvatar` and `UserRound`; `award-badge.tsx` needs `getAwardIcon`). The three shrunk source files import the newly extracted pieces from their new locations using the existing `@/components/...` path alias, matching how `page.tsx` already imports `StatsBand`, `StoryFeed`, `SparkMark`, and `UserAvatar` today. `"use client"` is preserved on every new file that uses hooks or event handlers (all of the extracted pieces do, since they all call TanStack Query hooks, `useForm`, or handle DOM events).

## Testing Decisions

This is a pure structural refactor with zero intended behavior change, so the correctness bar is: the app typechecks, builds, and renders/behaves identically to before the refactor on all three affected pages (`/`, `/awards`, and the story feed embedded in `/`).

**Existing test seams found in the repo:**
- There are no frontend unit tests anywhere in `apps/web` — no `*.test.tsx`/`*.spec.tsx` files, no Jest/Vitest config, and no test script in `apps/web/package.json`. If a unit-test framework is wanted for React components in the future, that is a separate decision outside this refactor's scope — this spec does not introduce one.
- There **is** an existing Playwright end-to-end suite at `apps/e2e` (`apps/e2e/tests/*.spec.ts`, run via `pnpm --filter @thanks-claude/e2e test`), and it already covers all three pages/components touched by this refactor: `story-feed.spec.ts`, `story-feed-avatars.spec.ts`, `story-award-picker.spec.ts`, `story-form-flow.spec.ts`, `awards-page.spec.ts`, `stats-band.spec.ts`, `like-flow.spec.ts`, `auth-flow.spec.ts`, `dark-mode-toggle.spec.ts`, plus `smoke.spec.ts`. These tests drive the real app through a browser and assert against accessible roles/labels (e.g. `page.getByRole("region", { name: "Story feed" })`, `page.getByRole("region", { name: "Awards list" })`) and API responses — they test external behavior, not file structure or internals, so they are unaffected by which file a component's code lives in and will keep passing unchanged if — and only if — the refactor introduces no behavior change.

**Testing decision for this refactor:**
- Treat the existing Playwright e2e suite as the regression safety net: it already exercises every page being restructured, at the correct (highest available) seam — full rendered behavior via accessible roles — and needs no changes itself.
- The bar for each ticket in this refactor is: `tsc`/Next.js typecheck stays green, `next build` stays green, and the existing e2e suite (`apps/e2e`) passes unchanged against the refactored code.
- Additionally, since this touches visual/interactive surfaces on all three pages, a manual visual check of `/`, `/awards`, and the story feed section of `/` (including the "Share a story" form, award checkboxes, pagination, and login/logged-in header states) should confirm no rendering or interaction difference.
- No new tests are being written as part of this refactor — there is no new behavior to test, and inventing a component-level unit-test framework is out of scope for a pure file-move exercise.

## Out of Scope

- No new component boundaries beyond what already exists today as separate named functions/components in the three source files (e.g. not splitting the hero section, "Share a story" form, or `AwardsList`'s list item markup into further sub-components).
- No prop signature changes on any component.
- No visual changes of any kind.
- No behavior changes of any kind (data fetching, form validation, event handling, error/loading states all stay exactly as they are).
- No per-feature subfolders (e.g. `components/story-feed/`, `app/awards/_components/`) — all new files are flat siblings in `apps/web/components/`.
- No new unit-test framework or new tests — out of scope for this pass (see Testing Decisions).
- No renaming of any existing exported component, prop, or type beyond what's needed to move it to its own file.

## Further Notes

- The grill output didn't flag any genuinely ambiguous points, and direct inspection of the three source files confirms they match the recorded extraction map in `grill/requirements.md`/`grill/decisions.md` exactly — no surprises turned up during exploration (e.g. no additional inline components, no undocumented shared helpers).
- One clarification worth flagging for ticket-writing (not a real ambiguity, since it follows directly from the "co-locate with sole consumer" decision already made): `createAwardSchema`/`CreateAwardValues` in `apps/web/app/awards/page.tsx` are currently used only by `CreateAwardForm`, so they move into `create-award-form.tsx` alongside it as private (non-exported) values, consistent with how `formatHours`/`pageNumbers`/`toggleAwardId` are handled — no separate schema file.

# Requirements: UI Component Decomposition

## Problem

Three files in `apps/web` are large React files with multiple components defined inline in one module:

- `apps/web/components/story-feed.tsx` (214 lines)
- `apps/web/app/awards/page.tsx` (215 lines)
- `apps/web/app/page.tsx` (384 lines)

Each already has its logic cleanly separated into named functions/components — they just all live in one file. This makes the files harder to navigate and out of step with the rest of the codebase, which already follows a flat one-file-per-component convention in `apps/web/components/` (e.g. `user-avatar.tsx`, `stats-band.tsx`, `spark-mark.tsx`).

## Solution

Split each of the three files into one file per component, under the existing flat `apps/web/components/` convention, as sibling files alongside the existing ones. This is a pure extraction + import-wiring exercise: move existing functions/components to their own files and rewire imports. No new component boundaries are invented, no props or APIs change, and named exports are used throughout (matching the existing `export function StoryFeed()` convention).

## Actors

Just the codebase and its maintainers — there is no end-user-facing behavior change at all. This is a pure internal refactor.

## Done looks like

- All three source files (`story-feed.tsx`, `awards/page.tsx`, `page.tsx`) are reduced to just their top-level page/entry component (plus a small number of things explicitly kept in place per the decisions below).
- The extracted pieces exist as new sibling files in `apps/web/components/`.
- The app still builds, typechecks, and renders identically — no visual or functional diff on any of the three pages.

## Out of scope

- No new decomposition beyond what already exists as separate named functions/components in the three files today (e.g. not splitting the hero section or story form in `page.tsx` into further sub-components).
- No prop signature changes.
- No behavior changes of any kind.
- No per-feature subfolders (e.g. `components/story-feed/`, `app/awards/_components/`) — rejected in favor of the existing flat layout.

## Full extraction map

`apps/web/components/story-feed.tsx` keeps only `StoryFeed`. New files in `apps/web/components/`:
- `award-badge.tsx` — `AwardBadge`, `AwardBadgeList`, and the `StoryAward` type (exported so `story-card.tsx` can import it)
- `story-byline.tsx` — `StoryByline`
- `story-card.tsx` — `StoryCard` + `formatHours` (imports `AwardBadgeList`/`StoryAward` from `award-badge.tsx`, `StoryByline` from `story-byline.tsx`)
- `feed-skeleton.tsx` — `FeedSkeleton`
- `pagination.tsx` — `Pagination` + `pageNumbers`

`apps/web/app/awards/page.tsx` keeps only `AwardsPage` (default export). New files in `apps/web/components/`:
- `awards-list.tsx` — `AwardsListSkeleton`, `AwardsList`
- `create-award-form.tsx` — `CreateAwardForm` + `createAwardSchema`/`CreateAwardValues`
- `login-prompt.tsx` — `LoginPrompt`
- `create-award-section.tsx` — `CreateAwardSection` (imports `LoginPrompt`, `CreateAwardForm`)

`apps/web/app/page.tsx` keeps `Home` (default export), `storyFormSchema`/`StoryFormValues`, and the three render helpers (`renderLikeCount`, `renderHeroStatsLine`, `formatHeroStatNumber`). New files in `apps/web/components/`:
- `header-auth-control.tsx` — `HeaderAuthControl`
- `award-checkbox-list.tsx` — `AwardCheckboxList` + `toggleAwardId`

## Verification

- Typecheck passes.
- Build passes.
- Manual check of the three pages confirms identical rendering/behavior.

No risky or unknown areas were flagged — this is considered mechanical.

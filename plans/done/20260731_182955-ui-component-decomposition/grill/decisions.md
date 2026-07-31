# Decisions: UI Component Decomposition

## Decision: Scope = pure file split, not further decomposition

Decided: Move each existing inline function/component to its own file; do not look for additional decomposition seams.

Why: Lowest risk, fastest, and all three files already have clean logical boundaries — inventing new ones adds risk without benefit.

Alternatives rejected: "File split + further decomposition" (e.g. splitting the hero section or story form in `page.tsx` into further sub-components) — rejected as unnecessary scope creep for this pass.

## Decision: Flat file layout in `apps/web/components/`, kebab-case names

Decided: Extracted files are flat siblings in `components/` (e.g. `story-card.tsx`, `award-badge.tsx`, `awards-list.tsx`), not grouped into per-feature subfolders.

Why: Matches the existing repo convention (`user-avatar.tsx`, `stats-band.tsx`, `spark-mark.tsx` are all flat siblings) — introducing a new nesting convention (e.g. `components/story-feed/`, `app/awards/_components/`) would be inconsistent with the rest of the codebase.

Alternatives rejected: Per-feature subfolders.

## Decision: Small pure helpers co-locate with their sole consumer component, not split into their own file

Decided: A helper function used by exactly one extracted component moves into that component's new file rather than getting a separate file of its own. Applies to: `formatHours` → moves into `story-card.tsx` with `StoryCard`; `pageNumbers` → moves into `pagination.tsx` with `Pagination`; `toggleAwardId` → moves into `award-checkbox-list.tsx` with `AwardCheckboxList`; `createAwardSchema`/`CreateAwardValues` → move into `create-award-form.tsx` with `CreateAwardForm`.

Why: Avoids an explosion of trivial one-line files; a helper and its sole consumer are one conceptual unit.

Alternatives rejected: Strict 1:1 (every function gets its own file).

## Decision: `page.tsx`'s three inline render helpers stay in `page.tsx`, not extracted

Decided: `renderLikeCount`, `renderHeroStatsLine`, and `formatHeroStatNumber` remain in `app/page.tsx` alongside `Home`.

Why: They are small formatting/render-branch helpers that take a hook's return value as a parameter and are only ever called inline within `Home` — they are not JSX components invoked as `<Tag/>`, so extracting them would be "new decomposition" beyond what's already component-shaped, contradicting the "pure file split" decision above.

Alternatives rejected: Extracting them for consistency with the other extracted pieces.

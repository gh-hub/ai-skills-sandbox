# 01 — Split story-feed.tsx into per-component files

**What to build:** `apps/web/components/story-feed.tsx` shrinks to just the `StoryFeed` component. Its other components/types/helpers move into new flat sibling files in `apps/web/components/`, each following the existing kebab-case/named-export convention (e.g. `user-avatar.tsx`), with `"use client"` preserved wherever hooks or event handlers are used:
- `award-badge.tsx` — `AwardBadge`, `AwardBadgeList`, `StoryAward` type
- `story-byline.tsx` — `StoryByline`
- `story-card.tsx` — `StoryCard`, with `formatHours` co-located as its sole private helper; imports `AwardBadgeList`/`StoryAward` from `award-badge.tsx` and `StoryByline` from `story-byline.tsx`
- `feed-skeleton.tsx` — `FeedSkeleton`
- `pagination.tsx` — `Pagination`, with `pageNumbers` co-located as its sole private helper

`StoryFeed` imports `StoryCard`, `FeedSkeleton`, and `Pagination` from their new files. Each new file carries only the imports it actually uses (e.g. `UserAvatar` moves with `StoryByline`, not with `StoryFeed`). This is a pure file split: no prop, behavior, or visual changes; no new component boundaries beyond what already exists as separate named functions/components today.

**Blocked by:** None — can start immediately.

**Status:** ready

- [x] `award-badge.tsx`, `story-byline.tsx`, `story-card.tsx`, `feed-skeleton.tsx`, `pagination.tsx` exist in `apps/web/components/`, each containing exactly the functions/types/helpers listed above, moved verbatim (no logic changes), with named exports and `"use client"` where needed — only `pagination.tsx` needs `"use client"` (it has `onClick` handlers); `award-badge.tsx`, `story-byline.tsx`, `story-card.tsx`, and `feed-skeleton.tsx` are plain server-safe components (no hooks, no event handlers), matching the existing `user-avatar.tsx`/`spark-mark.tsx` precedent in this codebase
- [x] `apps/web/components/story-feed.tsx` contains only `StoryFeed` plus the imports it still needs
- [x] All imports of the moved symbols are updated across the codebase — grepped `apps/web` and `apps/e2e` for `AwardBadge`, `AwardBadgeList`, `StoryAward`, `StoryByline`, `StoryCard`, `formatHours`, `FeedSkeleton`, `Pagination`, and `pageNumbers`; the only references are the new component files themselves and `story-feed.tsx`'s imports — no other consumers exist
- [x] `next build` (via `pnpm --filter @thanks-claude/web build`, which includes the Next.js/TypeScript typecheck — there is no separate `typecheck` script in this repo) passes with no new errors or warnings — confirmed, build succeeded cleanly
- [ ] The existing Playwright e2e suite in `apps/e2e` continues to pass unchanged, in particular `story-feed.spec.ts` and `story-feed-avatars.spec.ts` (and any other spec touching the story feed, e.g. `story-award-picker.spec.ts`, `like-flow.spec.ts`), run via `pnpm --filter @thanks-claude/e2e test` — not run in this session (requires the dockerized app/e2e stack); left for the review phase or a follow-up manual run
- [ ] Manual visual check: the story feed section of `/` renders identically — story cards, award badges, byline/avatar, pagination controls, and the loading skeleton all look and behave the same as before the split — not performed in this session; recommend a manual pass or Playwright-driven check before merge

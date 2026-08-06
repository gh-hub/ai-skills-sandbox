# Implement 01 — story-feed-split — session end-state

Split `apps/web/components/story-feed.tsx` into `award-badge.tsx` (`AwardBadge`, `AwardBadgeList`, `StoryAward` type), `story-byline.tsx` (`StoryByline`), `story-card.tsx` (`StoryCard` + `formatHours`), `feed-skeleton.tsx` (`FeedSkeleton`), `pagination.tsx` (`Pagination` + `pageNumbers`), plus a trimmed `story-feed.tsx` keeping only `StoryFeed`. Named exports throughout; `"use client"` added only where needed (pagination.tsx, story-feed.tsx).

Repo-wide grep confirmed no other consumers of the moved symbols existed outside `story-feed.tsx`. 4/6 acceptance criteria checked in `tickets/01-story-feed-split.md` — `pnpm --filter @thanks-claude/web build` passed clean; the Playwright e2e suite and a manual visual check were not run this session (left open for the review phase).

Next: review/round-1.

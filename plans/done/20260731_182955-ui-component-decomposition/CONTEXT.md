# Context: UI Component Decomposition

## What we're building
Split three oversized apps/web React files (story-feed.tsx, awards/page.tsx, page.tsx) into one file per already-existing component/function, as flat siblings in apps/web/components/, with zero behavior change.

## Key decisions
- Pure file split only, no new decomposition — see grill/decisions.md
- Flat kebab-case layout in apps/web/components/, no per-feature subfolders — see grill/decisions.md
- Small helpers co-locate with their sole consumer component's new file — see grill/decisions.md
- page.tsx's three inline render helpers stay in page.tsx, not extracted — see grill/decisions.md

## Tickets
- 01 — story-feed-split (`tickets/01-story-feed-split.md`)
- 02 — awards-page-split (`tickets/02-awards-page-split.md`)
- 03 — home-page-split (`tickets/03-home-page-split.md`)

No blocking edges between tickets — all three can start immediately.

## Current state
Phase: review
Completed tickets: 01-story-feed-split, 02-awards-page-split, 03-home-page-split
Current ticket: none
Plan complete.

## Load this session
- [spec.md](spec.md) — full extraction map, testing decisions, out-of-scope list for all three files

## Gotchas
- E2e (Playwright suite in apps/e2e) and manual visual checks were not run during any of the three implement tickets — only build/typecheck/lint were verified per-ticket and in the final combined build. These are still pending and should be covered by the review phase.

# Context: likes-feed-redesign

## What we're building
A paginated, public feed of user-shared stories (with hours-saved stats, reported + estimated) plus a full claude.com-inspired visual redesign of the "Thanks, Claude" landing page.

## Key decisions
- One combined plan for feed + redesign — see grill/decisions.md
- Feed shows likes with a non-empty `story`; hoursSaved shown only when present
- Numbered pagination, 10/page, newest-first, offset-based API
- New `GET /likes` (paginated) and `GET /likes/stats` endpoints — see grill/ADR-001.md
- Stats show reported sum AND estimated total side by side (not primary/secondary)
- No literal Anthropic logo/assets — original SVG "spark mark" instead
- Full landing-page restructure (hero → stats band → feed → footer), warm palette replacing current grayscale theme
- Out of scope: auth, moderation, edit/delete, admin panel, search
- Spec written — see spec.md (PRD: problem/solution, user stories, implementation & testing decisions)
- Tickets written and approved — see tickets/ (8 tickets: 01/02 API, 03/04 visual foundation, 05 page restructure, 06/07 feature UI, 08 final polish)

## Current state
Phase: implement
Completed tickets: none
Current ticket: plans/20260725_105431-likes-feed-redesign/tickets/01-paginated-story-feed-api.md

## Load this session
- plans/20260725_105431-likes-feed-redesign/tickets/01-paginated-story-feed-api.md
- plans/20260725_105431-likes-feed-redesign/spec.md
- plans/20260725_105431-likes-feed-redesign/grill/ADR-001.md
- coding-rules: nestjs-service-style skill (this ticket touches apps/api/src/likes/)

## Gotchas
- `likes.story` and `likes.hoursSaved` are both nullable columns (apps/api/src/db/schema.ts) — filtering/aggregation must handle nulls, not assume presence
- Existing `GET /likes/count` endpoint stays as-is; new `GET /likes` and `GET /likes/stats` are additions, not replacements
- `apps/web` has no `public/` directory yet — the spark mark SVG will need a home (inline component is likely simpler than a static asset)
- Current theme (apps/web/app/globals.css) is neutral oklch grayscale — redesign replaces these custom properties with a warm palette, in both `:root` and `.dark`
- Spec flags two open questions (out-of-range `page` behavior; whether `limit` is client-configurable) and two risks (ticket sequencing for mixed API+redesign scope; Postgres NULL-vs-0 on empty aggregates) — see spec.md "Further Notes"; tickets phase should account for these

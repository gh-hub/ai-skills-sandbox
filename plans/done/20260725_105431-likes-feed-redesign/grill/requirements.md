# Requirements: likes-feed-redesign

## Problem

"Thanks, Claude" lets visitors like Claude and optionally share a short story plus how many hours they saved. Today those stories are write-only — submitted but never shown back. Separately, the app's current look (default shadcn grayscale theme, single minimal page) doesn't reflect the warmth/polish of Claude's own brand.

## What we're building

1. A public, paginated feed of the stories people have shared (with hours saved shown alongside, when reported).
2. Honest aggregate stats about hours saved across the whole like base — both the literal reported sum and an estimated total extrapolated to people who didn't report a number — plus what fraction of likers didn't report at all.
3. A full visual redesign of the page into a landing-page structure (hero, stats band, story feed, footer), in a warm claude.com-inspired palette, with an original decorative "spark" mark (not a copy of Anthropic's actual logo/assets).

## What done looks like

- Visiting the page shows a hero with headline + original spark mark, a stats band (like count, reported hours saved, estimated hours saved, % without reported hours), and a scrollable/paginated feed of story cards below.
- The feed only shows likes that have a non-empty `story`; `hoursSaved` displays on the card when present, omitted when not.
- Feed pagination is numbered (Prev/Next + page numbers), 10 stories per page, newest first.
- The like button and "share a story" form continue to work as they do today, and immediately count toward stats/feed after submission.
- Light and dark mode both work (existing theme toggle preserved) in the new warm palette.
- No literal Anthropic-owned images/logos anywhere in the app.

## Out of scope

- Authentication / user accounts.
- Story moderation or profanity filtering.
- Editing or deleting existing likes.
- Admin panel / management UI.
- Search or keyword filtering within stories.

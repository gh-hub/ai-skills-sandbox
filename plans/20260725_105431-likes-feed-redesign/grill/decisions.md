# Decisions: likes-feed-redesign

## Decision: One combined plan
Decided: Build the story feed and the visual redesign together, in one plan, rather than as two separate plans.
Why: The feed is new UI that would need to be designed twice if the redesign followed separately.
Alternatives rejected: Ship feed on current UI first, redesign later.

## Decision: Feed qualification filter
Decided: A like appears in the feed if it has a non-empty `story`. `hoursSaved` is optional and shown only when present.
Why: Requiring both story and hoursSaved would hide genuine testimonials that just didn't include a number.
Alternatives rejected: Require both story AND hoursSaved to qualify.

## Decision: Pagination style
Decided: Classic numbered pagination (Prev/Next + page numbers), offset-based API, newest-first, 10 entries per page.
Why: User explicitly asked for pagination (not infinite scroll); 10/page is a reasonable default for a testimonial-style feed.
Alternatives rejected: 20/page; load-more/infinite-scroll pattern.

## Decision: New /likes/stats endpoint and formula
Decided: Add `GET /likes/stats` returning: `totalLikes`, `reportedHoursSaved` (sum of hoursSaved where present), `likesWithHoursReported` (count), `percentWithoutHoursReported`, `averageHoursPerReport` (`reportedHoursSaved / likesWithHoursReported`), `estimatedTotalHoursSaved` (`averageHoursPerReport × totalLikes`).
Why: User wants both an honest "reported" figure and an extrapolated estimate across everyone, including non-reporters, plus visibility into how much of the base didn't report.
Alternatives rejected: Showing only the raw reported sum with no extrapolation.

## Decision: Stats presentation
Decided: Present the reported sum and the estimated total side by side, as equally-weighted stats (not one primary/one secondary).
Why: Explicit user correction — avoid implying one number is more "real" than the other; both are meaningful and should be shown together.
Alternatives rejected: Reported sum as headline stat, estimate as smaller supporting stat.

## Decision: No literal Anthropic assets
Decided: Do not copy or embed Anthropic's actual logo, brand mark, or any images scraped from claude.com. Instead, hand-build an original decorative SVG "spark/star" mark inspired by that aesthetic, and take only the general look-and-feel (palette, typography, spacing) as inspiration.
Why: Anthropic's actual logo/brand assets are trademarked/copyrighted; embedding them verbatim would be a trademark issue regardless of this being a Claude-themed side project.
Alternatives rejected: Literally reusing/scraping Claude/Anthropic brand assets.

## Decision: Redesign scope
Decided: Full landing-page restructure — hero (headline + spark mark) → stats band → story feed (as a testimonials-style section) → footer. Not just an in-place restyle of the current minimal single-column layout.
Why: A fuller landing-page structure reads much closer to the referenced claude.com/product/overview feel than restyling the existing minimal layout would.
Alternatives rejected: Keep current single-page structure, restyle in place only.

## Decision: Color palette
Decided: Replace the current neutral grayscale shadcn theme with a warm claude.com-inspired palette (cream/parchment backgrounds, terracotta/coral primary accent), for both light and dark mode. Existing theme toggle (next-themes) is preserved.
Why: Matches the requested claude.com look and feel; current theme is cool neutral grayscale, not warm.
Alternatives rejected: Keep grayscale theme, focus redesign on layout/spacing/type only.

## Decision: Out-of-scope boundaries
Decided: No auth/accounts, no story moderation/profanity filtering, no edit/delete of existing likes, no admin panel, no search/filter within stories.
Why: Keeps this plan focused on display + stats + visual redesign; these are all separate, larger features.
Alternatives rejected: Including basic story moderation in this plan.

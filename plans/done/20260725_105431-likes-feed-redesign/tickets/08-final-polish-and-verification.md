# 08 — Final visual polish & cross-feature verification

**What to build:** A final pass over the complete landing page — hero, stats band, story feed, footer — to tighten spacing/typography/breakpoints, re-verify dark mode across every new section, and confirm the stats band and story feed update together correctly when a story is submitted.

**Blocked by:** 06 (stats band UI), 07 (story feed UI with pagination)

**Status:** ready

- [ ] Spacing, typography, and responsive breakpoints are reviewed and tightened across hero, stats band, story feed, and footer as one coherent page (not disjointed sections built independently).
- [ ] Dark mode is re-verified across every new section (hero, stats band, story feed, footer, pagination controls) — no leftover light-mode-only styling.
- [ ] End-to-end manual/automated check: submitting a story with an hours-saved number updates both the stats band (reported/estimated/percent) and the story feed (new card appears) in the same visit, without a manual page refresh.
- [ ] No literal Anthropic-owned assets, logo, or scraped imagery present anywhere in the final page (spot-check against ticket 04's spark mark and overall design).
- [ ] Full Playwright suite (`apps/e2e/tests/`) passes against the completed redesign.

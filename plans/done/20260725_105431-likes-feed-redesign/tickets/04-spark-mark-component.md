# 04 — Original spark mark component

**What to build:** A standalone, reusable, original decorative SVG "spark mark" component — inspired by Claude's general aesthetic, not a copy of any Anthropic asset — for use in the hero section.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] A new inline SVG React component exists (e.g. `apps/web/components/spark-mark.tsx`), not a static asset in a `public/` directory.
- [ ] The mark is an original, hand-built design (radiating/star-like form or similar) — verifiably not a copy/trace of Anthropic's actual logo or any scraped image.
- [ ] The component is themeable via the existing color tokens (e.g. `currentColor` or CSS variables) so it adapts correctly to both light and dark mode once ticket 03's palette is in place.
- [ ] Component accepts basic sizing props (e.g. a `size`/`className` prop) so it can be reused at different scales (hero vs. smaller contexts) without duplication.

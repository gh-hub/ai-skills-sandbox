# 01 — Hero terminal-box redesign

**What to build:** Replace the current hero section of the "Thanks, Claude" homepage (spark logo, big `<h1>`, subtitle paragraph) with a single bordered, `font-mono`, CSS-built terminal-style box, so the page's top visually evokes the Claude Code CLI's own splash screen. The box's title bar text ("Thanks, Claude (code)") is the page's one and only `<h1>`. Inside the box, a two-column layout shows: left column — a "Welcome!" greeting, the existing `SparkMark` logo, a live stats line ("{likes} likes · {hours}h saved so far" from `useLikesStats()`), and a terminal-path tagline ("~/thanks-claude"); right column — a "Tips for saying thanks" header + tip copy, a divider, a "What's new" header + story-sharing blurb, and a closing line ("See stories below ↓") that anchor-links to the existing `#stats-and-feed` section. Below the `sm` breakpoint the two columns stack vertically with the divider reorienting horizontally. The subtitle paragraph is removed entirely. The Like button, like count, and expandable "Share a story" form stay exactly as they are today, positioned directly below the box. `apps/e2e/tests/smoke.spec.ts`'s heading assertion is updated to expect "Thanks, Claude (code)".

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] The old hero `<section>` (SparkMark + `<h1>Thanks, Claude</h1>` + subtitle `<p>`) in `apps/web/app/page.tsx` is replaced by the terminal-style box
- [ ] The box has a title-bar area whose text is "Thanks, Claude (code)", rendered as the page's single `<h1>` element (no other `<h1>` exists on the page)
- [ ] The box uses a real CSS border (not literal Unicode box-drawing characters) built from existing theme tokens (e.g. `border-border`, `bg-card`), and its interior text uses Tailwind's `font-mono`
- [ ] Left column shows: a "Welcome!" greeting, the `SparkMark` component, a live line rendering total likes and estimated hours saved from `useLikesStats()` with a reasonable loading/error treatment, and a "~/thanks-claude" tagline
- [ ] Right column shows: a "Tips for saying thanks" header and tip line, a divider, a "What's new" header and story-sharing blurb, and a "See stories below ↓" line that anchor-links to `#stats-and-feed`
- [ ] At and above the `sm` breakpoint the two columns render side by side with a vertical divider; below `sm` they stack vertically with a horizontal divider
- [ ] The subtitle paragraph ("A small way to say thank you…") no longer appears anywhere on the page
- [ ] The Like button, like count display, and "Share a story" expandable form remain unchanged in behavior and markup, positioned directly below the box
- [ ] The box renders with correct contrast/readability in both light and dark theme
- [ ] `apps/e2e/tests/smoke.spec.ts` asserts `getByRole("heading", { name: "Thanks, Claude (code)" })` and the smoke test passes

# ADR-001: Hero Box Architecture

## Status
Accepted

## Context
The "Thanks, Claude" site's hero (`apps/web/app/page.tsx`, current hero section around lines 84-170) is being redesigned to visually resemble the Claude Code CLI's splash screen: a bordered terminal window with a title bar and two columns. This is a new, reusable-looking UI pattern (a "terminal box"), so the structural choices need to be recorded — future pages or components that want the same look should follow this shape rather than reinventing it.

Three structural questions needed answers: how to render the border, where the `<h1>` lives, and how the two columns behave responsively.

## Decision

1. **Border rendering: CSS, not Unicode box-drawing characters.** The box is a `<div>` with a real CSS border (theme tokens `border-border`/`bg-card`, small border-radius), not literal `╭─╮│╰─╯` characters. Unicode box art is fixed-width text and breaks or looks wrong at arbitrary responsive widths; a CSS border reflows naturally at any viewport size while still reading as a terminal window frame. Text inside the box uses Tailwind's `font-mono` utility (the system monospace stack) purely for typographic flavor — the frame itself is not text-based.

2. **Accessibility: the title bar text is the page's only `<h1>`.** Rather than having a decorative title-bar string plus a separate real (possibly visually-hidden) `<h1>` elsewhere, the title-bar text ("Thanks, Claude (code)") is styled and sized to sit visually in the border area *and* is the literal `<h1>` element. This avoids duplicate/conflicting page headings for screen readers and keeps the document outline simple, at the cost of the `<h1>` needing bespoke styling to fit the title-bar visual slot instead of using a plain heading style.

3. **Responsive behavior: stack, don't scroll.** The two-column layout collapses to a single stacked column (left content above right content) below the `sm` breakpoint, with the column divider switching from vertical to horizontal. Horizontal scrolling of the box on mobile was rejected as worse UX — box content is copy people read, not a table or code block where horizontal scroll is expected.

## Consequences
- The box's frame is pure CSS/Tailwind, so it inherits the app's existing dark/light theming for free via the same tokens already used elsewhere on the page — no new theming work.
- Because the `<h1>` must double as decorative title-bar text, its styling is coupled to the box's visual design; if the box's visual style changes significantly later, the `<h1>` styling changes with it (acceptable — it's one heading, not a shared component consumed elsewhere yet).
- No new dependencies, fonts, or design tokens were introduced.
- This box is scoped to this one page for now; if it's reused elsewhere later, it should be extracted into a shared component rather than copy-pasted, but that extraction is not part of this plan.

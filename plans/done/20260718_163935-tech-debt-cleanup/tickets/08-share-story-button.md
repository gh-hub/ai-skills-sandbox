# 08 — apps/web: Share-story toggle → shadcn Button

**What to build:** The raw `<button>` used for the "Share a story"/"Hide story" toggle in `page.tsx` is replaced with the shadcn `Button` component already imported and used elsewhere on the page, so the toggle looks and behaves consistently with the rest of the UI.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] The toggle button in `page.tsx` renders as the shadcn `Button` component instead of a raw `<button>`
- [ ] `onClick={() => setIsExpanded((prev) => !prev)}` behavior is preserved
- [ ] Button text ("Share a story"/"Hide story") is preserved
- [ ] Manually verified in a browser: the toggle renders visually consistent with the page's other buttons and still expands/collapses the story form

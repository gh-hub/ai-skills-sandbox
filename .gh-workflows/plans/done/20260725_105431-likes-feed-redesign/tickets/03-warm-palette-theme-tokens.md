# 03 — Warm palette theme tokens

**What to build:** Replace the app's neutral grayscale theme with a warm, claude.com-inspired palette (cream/parchment backgrounds, terracotta/coral accent), in both light and dark mode, without touching the theme-toggle mechanism itself.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `apps/web/app/globals.css` custom properties (`--background`, `--foreground`, `--card`, `--primary`, `--secondary`, `--muted`, `--accent`, `--border`, etc.) are updated to a warm cream/parchment + terracotta/coral palette in the `:root` block.
- [ ] The `.dark` block is updated to a corresponding warm dark-mode palette (not left as neutral grayscale) — dark mode should read as intentional, not forgotten.
- [ ] `next-themes`-driven toggle behavior (`components/theme-toggle.tsx`) is unchanged — only token values change.
- [ ] Existing UI (current single-column page, buttons, form, inputs) renders correctly with the new tokens — no broken contrast or invisible text in either mode.
- [ ] Existing Playwright `dark-mode-toggle.spec.ts` still passes (update assertions if they hardcode old color values).

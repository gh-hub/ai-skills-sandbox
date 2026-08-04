# 02 — Dark mode toggle

**What to build:** Wire `next-themes` into the `Providers` wrapper from ticket 01 (`attribute="class"`, `defaultTheme="system"`, `enableSystem`), with `suppressHydrationWarning` on `<html>` in `app/layout.tsx`. Add a header at the top of the page containing a sun/moon icon toggle button (shadcn `Button` + `lucide-react` icons) that cycles/toggles the theme.

**Blocked by:** 01 — styling & providers foundation

**Status:** ready

- [ ] On first visit, the site follows the OS light/dark preference with no action from the visitor
- [ ] Clicking the header toggle switches between light and dark mode
- [ ] The chosen theme persists across page reloads
- [ ] No visible flash of the wrong theme on page load

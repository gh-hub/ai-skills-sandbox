# 01 — Styling & providers foundation

**What to build:** Install Tailwind v4 + shadcn/ui in `apps/web` via shadcn's `init` flow (non-interactive, since the CLI may prompt), scaffolding `components.json` and the CSS-variable-based light/dark theme tokens it expects. Introduce a client-side `Providers` component (rendered from `app/layout.tsx` inside `<body>`) that will host the theme and query providers added by later tickets — for this ticket it can be an empty pass-through boundary. Install the base shadcn/ui components needed by later tickets: `button`, `input`, `textarea`, `label`, `form`. The existing page's behavior is unchanged; this ticket is pure foundation.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `apps/web` has Tailwind v4 configured and shadcn/ui's `components.json` present
- [ ] shadcn/ui `button`, `input`, `textarea`, `label`, `form` components are installed as editable source in the repo
- [ ] A client-side `Providers` component exists and is rendered from `app/layout.tsx`
- [ ] The app still builds and the existing page still renders and functions as before (no regressions)

# 02 — [spec] Reconcile story-feed-avatars.spec.ts edit with spec scope

**What to build:** `apps/e2e/tests/story-feed-avatars.spec.ts` was edited (a `siteHeader()` helper and scroll-past-hero calls added) during ticket 1, but the spec's Testing Decisions only enumerated `dark-mode-toggle.spec.ts`, `awards-page.spec.ts`, `admin-navigation.spec.ts`, `admin-roles-page.spec.ts`, `admin-users-page.spec.ts`, and `auth-flow.spec.ts` as needing updates. This appears necessary (the spec exercises a login flow the header consolidation legitimately affects) rather than unrequested scope creep — confirm that read, and if so, no code change is needed; instead update `spec.md`'s Testing Decisions to note this file was also affected, so the plan's own record of scope matches what was actually necessary.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] Confirmed the `story-feed-avatars.spec.ts` edit was a necessary consequence of the header consolidation (not unrelated scope creep) — or, if it turns out not to be necessary, reverted the unrelated portion. Confirmed necessary: `git diff HEAD -- apps/e2e/tests/story-feed-avatars.spec.ts` shows the home route now has two simultaneous `HeaderAuthControl` copies (hero card's own + the global `SiteHeader`'s), so the spec's bare `getByRole("button", { name: "Login" })` queries became Playwright strict-mode violations; the added `siteHeader()` helper + scroll-past-hero calls scope the queries to the global header's copy, matching the pattern already used in `dark-mode-toggle.spec.ts`.
- [x] `spec.md`'s Testing Decisions updated to list `story-feed-avatars.spec.ts` alongside the other ticket-1-affected specs, if the edit is confirmed necessary

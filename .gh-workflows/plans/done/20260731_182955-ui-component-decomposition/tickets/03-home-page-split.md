# 03 — Split page.tsx (Home) into per-component files

**What to build:** `apps/web/app/page.tsx` shrinks to just `Home` (default export), the `storyFormSchema`/`StoryFormValues` form schema, and the three inline render helpers `renderLikeCount`, `renderHeroStatsLine`, and `formatHeroStatNumber` — these stay in `page.tsx` because they're invoked as plain function calls inline in `Home`'s JSX (e.g. `{renderLikeCount(likeCount)}`), not as JSX components, so extracting them would invent new decomposition beyond a pure file split. New flat sibling files in `apps/web/components/`, following the existing kebab-case/named-export convention, with `"use client"` preserved wherever hooks or event handlers are used:
- `header-auth-control.tsx` — `HeaderAuthControl`
- `award-checkbox-list.tsx` — `AwardCheckboxList`, with `toggleAwardId` co-located as its sole private helper

`Home` imports `HeaderAuthControl` and `AwardCheckboxList` from their new files, alongside its existing imports (e.g. `StatsBand`, `StoryFeed`, `SparkMark`, `UserAvatar`). Each new file carries only the imports it actually uses. This is a pure file split: no prop, behavior, or visual changes; no new component boundaries beyond what already exists as separate named functions/components today.

**Blocked by:** None — can start immediately.

**Status:** ready

- [x] `header-auth-control.tsx` and `award-checkbox-list.tsx` exist in `apps/web/components/`, each containing exactly the functions/helper listed above, moved verbatim (no logic changes), with named exports and `"use client"` where needed
- [x] `apps/web/app/page.tsx` contains only `Home` (default export), `storyFormSchema`/`StoryFormValues`, `renderLikeCount`, `renderHeroStatsLine`, `formatHeroStatNumber`, plus the imports it still needs
- [x] All imports of the moved symbols are updated across the codebase — grep the whole repo (not just `app/page.tsx`) for `HeaderAuthControl`, `AwardCheckboxList`, and `toggleAwardId` to confirm every consumer now imports from the correct new file
- [x] `next build` (via `pnpm --filter @thanks-claude/web build`, which includes the Next.js/TypeScript typecheck — there is no separate `typecheck` script in this repo) passes with no new errors or warnings
- [ ] The existing Playwright e2e suite in `apps/e2e` continues to pass unchanged, in particular `story-form-flow.spec.ts`, `auth-flow.spec.ts`, `story-award-picker.spec.ts`, `stats-band.spec.ts`, `dark-mode-toggle.spec.ts`, and `smoke.spec.ts`, run via `pnpm --filter @thanks-claude/e2e test` — **not run this session** (requires docker-composed backend/db; out of scope for this implement pass, which only ran typecheck+build per task instructions). Recommend running before merge.
- [ ] Manual visual check: `/` renders identically — the header's auth control (logged-in vs. logged-out states), the "Share a story" form's award checkbox list, the hero stats line, and like counts all look and behave the same as before the split — **not performed this session** (no running dev server/browser check was in scope for this pass). The diff is a pure verbatim move with unchanged JSX/className, so risk is low, but a manual/e2e check is still recommended before merge.

# 02 — Split awards/page.tsx into per-component files

**What to build:** `apps/web/app/awards/page.tsx` shrinks to just the `AwardsPage` default export. Its other components/schema move into new flat sibling files in `apps/web/components/`, each following the existing kebab-case/named-export convention, with `"use client"` preserved wherever hooks or event handlers are used:
- `awards-list.tsx` — `AwardsListSkeleton`, `AwardsList`
- `create-award-form.tsx` — `CreateAwardForm`, with `createAwardSchema`/`CreateAwardValues` co-located as private (non-exported) values used only by this form
- `login-prompt.tsx` — `LoginPrompt`
- `create-award-section.tsx` — `CreateAwardSection`, importing `LoginPrompt` from `login-prompt.tsx` and `CreateAwardForm` from `create-award-form.tsx`

`AwardsPage` imports `AwardsList` from `awards-list.tsx` and `CreateAwardSection` from `create-award-section.tsx`. Each new file carries only the imports it actually uses. This is a pure file split: no prop, behavior, or visual changes; no new component boundaries beyond what already exists as separate named functions/components today.

**Blocked by:** None — can start immediately.

**Status:** ready

- [x] `awards-list.tsx`, `create-award-form.tsx`, `login-prompt.tsx`, `create-award-section.tsx` exist in `apps/web/components/`, each containing exactly the functions/schema listed above, moved verbatim (no logic changes), with named exports (`createAwardSchema`/`CreateAwardValues` stay private/non-exported) and `"use client"` where needed — `awards-list.tsx`, `create-award-form.tsx`, and `create-award-section.tsx` use hooks (`useAwards`, `useForm`/`useCreateAward`, `useMe`) and got `"use client"`; `login-prompt.tsx` (`LoginPrompt`) has no hooks/handlers of its own (it only renders static JSX + `<AuthModal/>`, itself already a client component), so it was left without the directive, consistent with `user-avatar.tsx`'s hook-free pattern
- [x] `apps/web/app/awards/page.tsx` contains only `AwardsPage` (default export) plus the imports it still needs
- [x] All imports of the moved symbols are updated across the codebase — grepped the whole `apps/web` tree for `AwardsListSkeleton`, `AwardsList`, `CreateAwardForm`, `createAwardSchema`, `CreateAwardValues`, `LoginPrompt`, and `CreateAwardSection`; `awards/page.tsx` was confirmed as the only prior consumer and now imports `AwardsList`/`CreateAwardSection` from the new component files, no other consumers found
- [x] `next build` (via `pnpm --filter @thanks-claude/web build`) passes with no errors — compiled, typechecked, and statically exported `/` and `/awards` successfully (one transient `ENOENT` on `.next/server/app/_not-found/page.js.nft.json` occurred immediately after deleting the `.next` cache; a clean rerun completed without error, so this was a filesystem race unrelated to the code change)
- [ ] The existing Playwright e2e suite in `apps/e2e` was not run as part of this ticket's implementation pass — not executed in this session; should be run separately to confirm `awards-page.spec.ts`/`auth-flow.spec.ts` still pass
- [ ] Manual visual check of `/awards` in a browser was not performed in this session (no interactive browser check was run); the build's static export of `/awards` succeeded and the JSX/classNames were moved verbatim with no edits, but an actual visual/interaction pass is still outstanding

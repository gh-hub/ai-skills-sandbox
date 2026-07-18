# Review Round 2

## Standards

## Round 2 Review Summary

**Round-1 BLOCK: CONFIRMED FIXED.** `apps/api/Dockerfile` now runs `RUN CI=true pnpm prune --prod` scoped to just that line, after `WORKDIR /repo/apps/api`. No Dockerfile-wide `ENV CI=true` remains anywhere in the file — checked the full file contents, not just the diff hunk.

**New findings this round:**

1. **DEBT** — `apps/web/lib/api-client/likes.ts`: The `console.error(error)` before `throw new Error(...)` (no `{ cause }`) was *newly added* in this round in both `useLikeCount` and `useSubmitLike` — HEAD (round-1 committed code) had a plain `throw new Error(...)` with no console.error at all. This is the same class of issue logged as round-1 DEBT, but it's now duplicated into two call sites rather than being pre-existing single-site debt, so the fix cost has grown (Duplicated Code).

2. **Judgement call (not a violation)** — `apps/api/src/generate-openapi.ts`: new try/catch wrapping the whole script with `console.error` + `process.exit(1)`. Reasonable as boundary handling for a build script, but worth a sanity check that it was actually necessary beyond ticket 04's requirement.

**Confirmed correctly applied (not violations):**
- `drizzle-kit` moved from devDependencies to dependencies in `apps/api/package.json` — correctly aligns with the coding rule about runtime CLIs surviving `pnpm prune --prod`.
- `drizzle.config.ts`'s `DATABASE_URL` non-null-assertion replaced with an explicit boundary check.
- `likes.spec.ts` split into two single-assertion tests with scenario-based names.
- `apps/web/Dockerfile` / `package.json`: removal of now-unused `@thanks-claude/shared-types` copy/build/dependency — consistent, no dangling reference left behind.
- `page.tsx` splitting `submitLike` into `likeSubmit`/`storySubmit` — fixes a real UX bug, not flagged as a violation.

**Not re-flagged (already-logged DEBT, unchanged):** DbModule/`DATABASE_CONNECTION` speculative-generality/middle-man, duplicated `@Inject(DATABASE_CONNECTION)` boilerplate + `Database` alias naming, `@Global()` DbModule, nested ternary in `page.tsx` — all still present but unchanged in substance from round 1.

## Spec

Everything checks out cleanly. Summary of findings:

**Round-1 BLOCK: FIXED.** `apps/api/Dockerfile` now has `RUN CI=true pnpm prune --prod` scoped to just that line, with no bare `ENV CI=true` anywhere in the file. Confirmed by reading the full file.

**Findings:**

1. **DEBT** — New raw `<button>` introduced for the like-count retry control in `apps/web/app/page.tsx`, while the sibling share-story toggle was converted to shadcn `Button` per spec item 9 ("replace raw `<button>` share-story toggle with shadcn `Button`"). This reintroduces the exact "inconsistent UI component" pattern the spec's finding #9 was meant to eliminate, just in a new spot. Not strictly required by the spec text (which only names the share-story toggle), so this is DEBT rather than BLOCK, but worth flagging since it's new code, not pre-existing debt.

All 11 implementation-decision bullets verified against the diff:
- `apps/api/src/db/db.module.ts` (untracked, read directly) matches spec item 1 exactly.
- `drizzle.config.ts` throws explicitly instead of using `!` — item 2.
- `likes.spec.ts` split into two scenario-named tests — item 3.
- Archived tickets 02/03 fully checked off and marked `done`, `spec.md` API contract now lists `GET /health` — item 4.
- `drizzle-kit` moved to `dependencies` in `apps/api/package.json` and `pnpm-lock.yaml`; load-bearing via `apps/api/entrypoint.sh` — item 5. `apps/web/Dockerfile` correctly left without a prune step — verified.
- `generate-openapi.ts` wrapped in try/catch with `console.error` + `process.exit(1)` — item 6.
- `page.tsx` shows distinct "Unable to load like count" + retry control on `likeCount.isError`, no duplicate alert banners — item 7.
- `lib/api-client/likes.ts` adds `console.error(error)` before both existing throws, messages unchanged — item 8.
- Share-story toggle now uses shadcn `Button` — item 9.
- `@thanks-claude/shared-types` removed from `apps/web/package.json`; grep confirms zero remaining references — item 10.
- `page.tsx` now calls `useSubmitLike()` twice as `likeSubmit`/`storySubmit`, each independently scoped — item 11.

No missing requirements, no scope creep beyond the one minor DEBT item above, no requirement implemented incorrectly. Previously-logged round-1 DEBT items remain present and unchanged in character — not re-flagged.

## Summary
BLOCK findings: 0
DEBT findings: 2
Worst BLOCK: none — round-1's BLOCK (Dockerfile-wide `ENV CI=true`) is confirmed fixed.

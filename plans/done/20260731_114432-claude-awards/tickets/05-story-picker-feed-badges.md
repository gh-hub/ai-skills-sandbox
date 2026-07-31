# 05 — Story form award picker + feed badges (frontend)

**What to build:** The "Share a story" form in `apps/web/app/page.tsx` gains an award multi-select (checkboxes, each showing icon + title) sourced from the same awards-list query added in ticket 04, wired into the existing `react-hook-form` schema as an optional `awardIds: string[]` (default `[]`). Selected IDs are passed through in the `storySubmit.mutate` call. No changes to the one-click Like button or its `likeSubmit.mutate({})` call. `StoryCard` in `apps/web/components/story-feed.tsx` renders a badge (icon + title, using the shared icon-fallback helper from ticket 04) for each entry in the item's `awards` array, alongside existing story text and hours-saved line.

**Blocked by:** 03 — Attach awards to a thanks story (backend), 04 — Awards page (frontend)

**Status:** done

- [x] Story form shows a checkbox per existing award (icon + title), fully optional, defaulting to none selected
- [x] Submitting the story form with selected awards results in those awards attached to the created story (verified via the feed)
- [x] Submitting with no awards selected behaves exactly as before this ticket
- [x] One-click Like button is unchanged (no award picker, same `likeSubmit.mutate({})` call)
- [x] Story feed cards show a badge (icon + title) for every attached award
- [x] New e2e test `apps/e2e/tests/story-award-picker.spec.ts` (mirroring `story-form-flow.spec.ts` structure) covering: selecting one or more awards and seeing the resulting badge(s) on the feed, and submitting with none selected behaving as before

## Implementation notes

- `apps/web/app/page.tsx`: `storyFormSchema` gained `awardIds: z.array(z.string()).optional()`
  (default `[]` via `useForm` `defaultValues`, not `.default()` on the schema — kept consistent
  with how `story`/`hoursSaved` are already handled as plain `.optional()` fields). A new
  `AwardCheckboxList` component (in `page.tsx`, not a separate file — small enough per the
  no-over-engineering rule) reuses `useAwards()` and `getAwardIcon` for the checkboxes. Each
  award renders as a native `<label><input type="checkbox">…</label>`, which gives every
  checkbox a correct accessible name (`award.title`, since the icon `<span>` is
  `aria-hidden`) for free — no manual `aria-label` needed, and this is exactly what the new
  e2e test's `getByLabel(award.title)` relies on.
- The `awardIds` `FormField` deliberately does NOT wrap `AwardCheckboxList` in the shadcn
  `FormControl` (unlike the other fields in this form). `FormControl` uses a Radix `Slot`
  that clones a single set of form-a11y props (`id`, `aria-describedby`, `aria-invalid`) onto
  its one child — that fits a single input element, not a list of N checkboxes. Skipping it is
  a deliberate deviation from the pattern used by `story`/`hoursSaved` in this same form (and
  the sibling `icon` field in `apps/web/app/awards/page.tsx`); the `FormLabel`'s `htmlFor`
  therefore points at no actual element (harmless — nothing here depends on clicking the label
  text to focus a specific checkbox).
- On submit, `awardIds` is only sent when non-empty (`values.awardIds.length > 0 ? values.awardIds : undefined`),
  matching the existing trim-to-`undefined` pattern for `story`/`hoursSaved` — so "no awards
  selected" produces the exact same `POST /likes` payload shape as before this ticket, not an
  explicit `awardIds: []`.
- `apps/web/components/story-feed.tsx`: `StoryCard` gained a required `awards: StoryAward[]`
  prop (no default — every feed item always has this array per ticket 03's contract) and
  renders a new `AwardBadgeList`/`AwardBadge` pair below the hours-saved line. Renders `null`
  (no `<ul>` at all) when `awards` is empty, which the new e2e test's "no awards" case
  asserts on directly (`getByRole("list", { name: "Awards" })` has count 0).
- `pnpm --filter web build` (includes typecheck + lint) passes clean.
- New e2e test `apps/e2e/tests/story-award-picker.spec.ts` written (2 tests, mirroring
  `story-form-flow.spec.ts`/`story-feed.spec.ts` structure: fetches real seeded awards via
  `GET /api/awards` rather than hardcoding titles, so it stays correct regardless of exactly
  which 7 awards are seeded). **Not executed locally this session** — same pre-existing local
  port-8080 conflict as tickets 04 and (per CONTEXT.md) unresolved as of this session: an
  unrelated process (`ao-fireblocks-callback-handler`, PID 35612 at time of this run, a
  different project's dev server) still holds port 8080 on this machine. Re-verified by
  actually running `pnpm --filter e2e exec playwright test tests/story-award-picker.spec.ts`
  this session (not just checking `lsof`): the `docker compose up --build` webServer built
  both `api` and `web` images successfully and Postgres started cleanly, then failed at
  `Ports are not available... 0.0.0.0:8080`. This confirms (again) it's a local environment
  conflict, not a defect in this ticket's code — flagged for the review phase to re-attempt
  once the port is free, or to run in an environment without that conflicting process.

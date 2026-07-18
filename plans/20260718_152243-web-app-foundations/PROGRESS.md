# Progress: web-app-foundations

## Current phase
review

## Current ticket path
(none)

## Phases
- [x] grill (2026-07-18)
- [x] spec (2026-07-18)
- [x] tickets (2026-07-18)
- [x] implement/01-styling-providers-foundation (2026-07-18)
- [x] implement/02-dark-mode-toggle (2026-07-18)
- [x] implement/03-typed-api-client-generation (2026-07-18)
- [x] implement/04-like-count-submission-query (2026-07-18)
- [x] implement/05-story-form-rhf-zod (2026-07-18)
- [ ] review/round-1

## Review rounds
(none yet)

## Last session end-state
Ticket 05 (story-form-rhf-zod) complete — all five implement tickets done, ready for review. `apps/web/app/page.tsx`'s story form (previously native `<textarea>`/`<input>` with local `useState`) is now built with `react-hook-form` + `zodResolver` + shadcn `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage`, using the already-installed `input.tsx`/`textarea.tsx`/`label.tsx` shadcn components. `story` and `hoursSaved` are both kept as RHF string fields (matching what an `<input type="number">`/`<textarea>` actually produce) with `defaultValues: { story: "", hoursSaved: "" }`; the Zod schema (`storyFormSchema`) is `{ story: z.string().optional(), hoursSaved: z.string().optional().refine(...) }` where the refine allows blank/undefined but rejects `Number(value) < 0`, rendering inline via `FormMessage`. String→number conversion for the actual API call happens in `handleStorySubmit` (mirrors the pre-ticket-05 manual-fetch code's trim/convert logic) immediately before calling `submitLike.mutate()` from ticket 04's `useSubmitLike()` — so the mutation itself is untouched, only its caller changed. On `onSuccess`, `form.reset()` and `setIsExpanded(false)` both run, matching the old collapse-on-success UX. No new dependencies were needed — `react-hook-form`, `zod`, and `@hookform/resolvers` were already present in `apps/web/package.json` (added ahead of schedule, likely during ticket 01's scaffolding) and already in `node_modules`. Verified: `pnpm exec tsc --noEmit` and `pnpm build` (static export) both pass; ran `docker compose up -d --build` (postgres + api + nginx-fronted web), curled `GET /api/likes/count`, `POST /api/likes` with a valid body (count incremented, matching ticket 04's mutation/invalidation), and `POST /api/likes` with `hoursSaved: -3` directly against the API (API itself returns 201 — confirms the API's own validation is looser than the new client-side Zod bound, as noted in CONTEXT.md's key decisions), then `docker compose down`. No browser tool was available this session (same recurring gotcha as tickets 02/04) — the inline validation-error rendering and the expand/collapse/reset UX were verified by reading the component logic and shadcn `Form` primitives (`FormMessage` renders `fieldState.error.message`, confirmed by reading `components/ui/form.tsx`), not by an actual click-through in a live browser. Next: start a new session and run /dev-workflow to begin review/round-1 — all 5 tickets are implemented, no plan deviations, no unresolved gotchas blocking review.

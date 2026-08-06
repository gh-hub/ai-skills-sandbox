# 05 — Story form via React Hook Form + Zod

**What to build:** Add `react-hook-form`, `zod`, and `@hookform/resolvers`. Define a Zod schema for the story form: `story` optional string (no additional constraint), `hoursSaved` optional number that must be non-negative when provided. Wire the form with `useForm` + `zodResolver`, rendered through shadcn/ui's `Form` component family (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`) so validation errors render inline per-field. On valid submit, call the ticket-04 mutation with `story`/`hoursSaved`; on success, reset the form and collapse the "share a story" section, matching current UX.

**Blocked by:** 01 — styling & providers foundation, 04 — like count & submission via TanStack Query

**Status:** ready

- [ ] Expanding "share a story" shows the story/hoursSaved form built from shadcn `Form` components
- [ ] Entering a negative `hoursSaved` shows an inline validation error and does not submit
- [ ] Submitting valid story/hoursSaved (or leaving both blank) succeeds via the typed-client mutation
- [ ] On successful submit, the form resets and the story section collapses
- [ ] The like count reflects the submission (mutation still invalidates/refetches count)

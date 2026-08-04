# Review Round 1

## Standards

**apps/web/lib/api-client/likes.ts** — `if (error) throw new Error("Failed to load like count")` and the equivalent in `useSubmitLike` discard the actual `error` object from `openapi-fetch` (which may carry response status/validation detail) and replace it with a generic string. This is a system boundary (external API call) where the standard says "do not swallow errors silently" — the real error is dropped, not surfaced or logged. **DEBT.**

**apps/web/lib/utils.ts** — file is named `utils.ts` and exports a single `cn` helper. Standards explicitly list "utils" as a banned generic name. This is standard shadcn/ui scaffolding convention, so it's arguably tooling-idiomatic rather than a real design smell, but it is a literal rule violation. **DEBT (judgement call — ecosystem convention, low priority).**

**apps/api/src/generate-openapi.ts** — `generateOpenApiDocument()` is called with no `.catch`/try-catch around `NestFactory.create` + `writeFileSync`. A failure (e.g., DB unreachable during `AppModule` bootstrap) surfaces only as an unhandled rejection. This is a boundary (filesystem + full app bootstrap) that arguably warrants explicit handling, but as a build-time script this is a minor concern. **DEBT.**

**apps/web/app/page.tsx** — the two `FormField` blocks (story, hoursSaved) are structurally near-identical (Duplicated Code smell), but with only two fields, extracting a generic field-renderer would itself be premature abstraction per the "three similar lines is better than a premature abstraction" rule. Not flagging — correct call as-is.

**Good compliance to note (no violations found):**
- `useLikeCount` / `useSubmitLike` / `isExpanded` / `isMounted` / `isDark` — naming follows `is`/`use` conventions correctly.
- `handleStorySubmit` does one thing (submit + reset on success via callback), no hidden side effects beyond what TanStack Query's `mutate`/`onSuccess` signature implies.
- No commented-out code, no WHAT-comments (the `schema.d.ts` auto-generated header is a WHY/do-not-edit note, acceptable).
- `.dockerignore` already excludes `**/*.tsbuildinfo` and `apps/api/tsconfig.build.json` already sets `rootDir` correctly for `drizzle.config.ts` — both pre-existing, unaffected by this diff, no new violation introduced.
- No new abstractions beyond ticket scope (typed `apiClient`, query hooks, shadcn primitives) — all directly serve the stated plan.

**Overall:** clean scaffolding diff; only real finding worth acting on before/soon after ship is the discarded error detail in `lib/api-client/likes.ts` (DEBT). Nothing rises to BLOCK.

## Spec

**Verified correct — user story 9 (specific focus area):** `apps/web/app/page.tsx` does surface `isError` state visibly, not just in the hook. Both `likeCount.isError` and `submitLike.isError` render as separate `<p role="alert">` messages in the JSX (lines 65-70), with distinct copy for count-load vs. submission failure. This satisfies "I want a clear error message if the like count fails to load or my submission fails" — no gap here.

**DEBT — Incomplete shadcn migration on page.tsx.** Spec: *"app/page.tsx: rebuilt using shadcn/ui components, the typed-client-backed query/mutation, and the RHF+Zod form."* The "Share a story" toggle button (`apps/web/app/page.tsx:81-83`) was left as a raw `<button>` while the Like and Submit buttons were converted to shadcn's `Button`. Minor but real inconsistency with the stated migration scope — same functional behavior, unstyled control.

**DEBT — Stale unused dependency.** `apps/web/package.json` still lists `"@thanks-claude/shared-types": "workspace:*"`, but the only prior usage (`CreateLikeRequest`/`LikeCount` types in `page.tsx`) was removed and replaced by the generated OpenAPI schema types. The dependency is now dead weight. Spec says *"`packages/shared-types` is untouched"* (true for the package itself), but leaving an unused dependency behind after fully replacing its only call site is debt the migration should have cleaned up.

**DEBT — Shared mutation state couples unrelated actions.** Both the bare "Like" click and the story-form submit call the same `useSubmitLike()` mutation instance (`page.tsx:73` and `:47`), so `isPending`/`isError` are shared across both actions. A failed plain "Like" click can leave a stale "Couldn't submit your like" error visible after the user later opens and interacts with the story form, and both buttons disable together during either action's pending state. Not a spec violation (story 9 only requires *a* clear error message), but a UX rough edge worth flagging.

**No BLOCK findings.** Checked and confirmed correct: `next-themes` setup (`ThemeProvider attribute="class" defaultTheme="system" enableSystem`, `suppressHydrationWarning`), Providers wrapper structure, TanStack Query/devtools conditional rendering, Zod schema semantics (`story` unconstrained, `hoursSaved` non-negative refine), RHF+`Form` wiring with inline `FormMessage`, the `generate-openapi.ts` script (matches `main.ts`'s `DocumentBuilder`/`SwaggerModule` sequence, never calls `app.listen`, doesn't require a live DB connection — satisfies user story 11), and no API contract/business-logic changes. No scope creep detected (no new endpoints, no CI wiring, no extra pages).

## Summary
BLOCK findings: 0
DEBT findings: 6
Worst BLOCK: none

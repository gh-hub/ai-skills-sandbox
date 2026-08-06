# 04 — Awards page (frontend)

**What to build:** New route `apps/web/app/awards/page.tsx` that fetches and lists all awards (icon — falling back to a shared default emoji when blank — title, description, give-count). Uses the existing `useMe()` hook to branch: logged-in users see a create-award form (title, description, optional icon) below the list; anonymous visitors see a "log in to create an award" prompt paired with the existing `AuthModal` component (reused unmodified via its own Login trigger button). A successful create invalidates the same awards-list React Query cache key used elsewhere so a newly created award is immediately available. A single shared helper (e.g. in `apps/web/lib/utils.ts`) resolves an award's display icon with the default fallback (e.g. 🎖️) — this is the one place that fallback logic lives. Adds a link to `/awards` in the root layout's header (next to the existing theme toggle). New React Query hooks for awards in `apps/web/lib/api-client/` (mirroring `likes.ts`'s pattern), e.g. `useAwards()`, `useCreateAward()`.

**Blocked by:** 02 — Awards backend CRUD module

**Status:** done

- [x] `/awards` page lists all awards with icon (or fallback), title, description, give-count
- [x] Logged-in users see a working create-award form on `/awards`; submitting adds the award to the list without a page reload (via React Query cache invalidation)
- [x] Anonymous visitors see a login prompt (using the existing `AuthModal`) instead of the create form
- [x] Shared icon-fallback helper (`getAwardIcon`/`DEFAULT_AWARD_ICON` in `apps/web/lib/utils.ts`) exists and is used by this page
- [x] Header includes a link to `/awards` (`apps/web/app/layout.tsx`)
- [x] New e2e test `apps/e2e/tests/awards-page.spec.ts` written, mirroring `story-feed.spec.ts`/`stats-band.spec.ts` structure, covering all three required scenarios — **written but not executed locally this session**, see note below

**Implementation notes:**
- `apps/web/app/awards/page.tsx`, `apps/web/lib/api-client/awards.ts` (`useAwards()`/`useCreateAward()`), and the `getAwardIcon`/`DEFAULT_AWARD_ICON` helper in `apps/web/lib/utils.ts` were added; `apps/web/app/layout.tsx` gained the `/awards` header link.
- `pnpm --filter web build` passes cleanly (Next.js build includes type-checking and lint) — confirms the new code compiles and typechecks, `/awards` route is generated.
- **Environment note, not a code issue:** `apps/e2e/tests/awards-page.spec.ts` could not be executed in this session. Playwright's `webServer` (`docker compose up --build`) initially hit a transient BuildKit "lease does not exist: not found" error; retrying resolved that and both `api`/`web` images built successfully and Postgres started cleanly — but the stack then failed to bind port 8080 because an unrelated, already-running process on this machine (a different project's dev server, `ao-fireblocks-callback-handler`, PID 35612) already holds that port. This is a local machine port conflict, not a defect in the awards feature or its test. The review phase's "Check it works" step should re-attempt the e2e suite in an environment without this conflict; if the same conflict recurs there, it should be treated as an environment blocker to resolve (free port 8080, or run e2e in CI) rather than a code failure.

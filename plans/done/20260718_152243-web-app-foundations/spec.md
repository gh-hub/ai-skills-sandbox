# Spec: web-app-foundations

## Problem Statement

`apps/web` (the "Thanks, Claude" Next.js app) is a bare-bones static-export shell: one page, no styling framework, no dark mode, and a single form (like + optional story/hours-saved submission) wired by hand with `useState` and raw `fetch`. There's no compile-time link between what the NestJS API actually accepts/returns and what the frontend assumes, and no form validation library. None of this scales past a single page.

## Solution

Introduce four pieces of foundational tooling, and prove them out by migrating the app's one existing page onto all four rather than leaving them unused:

1. **Styling** — Tailwind CSS v4 + shadcn/ui, installed together via shadcn's init flow.
2. **Dark mode** — `next-themes`, defaulting to system preference, toggle in a new header.
3. **Data fetching** — TanStack Query, backed by a typed API client generated from the API's OpenAPI spec (`openapi-typescript` + `openapi-fetch`).
4. **Forms** — React Hook Form + Zod, applied to the story form with client-side bounds beyond what the API currently enforces.

## User Stories

1. As a visitor, I want the site to follow my OS light/dark preference by default, so that it matches the rest of my system without me doing anything.
2. As a visitor, I want to manually toggle between light and dark mode, so that I can override the system default if I prefer.
3. As a returning visitor, I want my theme choice to persist across page loads, so that I don't have to re-select it every visit.
4. As a visitor, I want the page to render in my chosen theme with no flash of the wrong theme, so that the experience feels polished.
5. As a visitor, I want to see the current like count when I load the page, so that I know how many people have liked it.
6. As a visitor, I want to click "Like" and see the count update, so that I get confirmation my action registered.
7. As a visitor, I want to optionally share a story and/or hours saved when I like, so that I can contribute more context if I want to.
8. As a visitor, I want clear feedback if my hours-saved input is invalid (e.g. negative), so that I know to correct it before submitting.
9. As a visitor, I want a clear error message if the like count fails to load or my submission fails, so that I understand something went wrong and can retry.
10. As a developer, I want the frontend's understanding of API request/response shapes to be generated from the API's actual OpenAPI spec, so that a change to the API's DTOs is caught at compile time in the frontend instead of silently drifting.
11. As a developer, I want to regenerate those types without needing a running API server or database, so that I can do it as part of routine frontend work with minimal setup.
12. As a developer, I want shadcn/ui components available as editable source in the repo, so that future UI work has a consistent, themeable component base instead of hand-rolled markup.

## Implementation Decisions

### Styling — Tailwind v4 + shadcn/ui
- Run shadcn/ui's `init` CLI in `apps/web`, which installs Tailwind v4, creates `components.json`, and scaffolds the CSS-variable-based theme (light/dark tokens) it expects.
- Install shadcn/ui components as needed: `button`, `input`, `textarea`, `label`, `form` (RHF-integrated), and whatever primitive the header/toggle needs.
- See ADR-002 for the full rationale.

### Dark mode — next-themes
- Wrap the app in `next-themes`'s `ThemeProvider`, `attribute="class"`, `defaultTheme="system"`, `enableSystem`.
- Because `app/layout.tsx` is currently a Server Component and `ThemeProvider` requires client-side context, introduce a small client component wrapper (e.g. a `Providers` component) that layout.tsx renders inside `<body>`.
- Add a new header at the top of the page containing a sun/moon icon toggle button (shadcn `Button` + an icon set — `lucide-react`, which shadcn/ui components use by convention) that cycles/toggles the theme.
- `suppressHydrationWarning` on `<html>` per next-themes' documented setup, to prevent the theme-mismatch hydration warning that's expected and harmless with this pattern.

### Typed API client — openapi-typescript + openapi-fetch
- **`apps/api`**: add a script (e.g. `scripts/generate-openapi.ts`, run via a new `package.json` script such as `generate:openapi`) that builds the Nest application object and calls the same `DocumentBuilder`/`SwaggerModule.createDocument` sequence already used in `src/main.ts`, then writes the resulting document to `apps/api/openapi.json`. It must not call `app.listen(...)` — no server needs to bind a port, no DB connection is required beyond whatever Nest's module graph construction needs.
- **`apps/web`**: add `openapi-typescript` and `openapi-fetch` as dependencies. Add a script (e.g. `generate:api-types`) that runs `openapi-typescript ../api/openapi.json -o lib/api-client/schema.d.ts`.
- Create `apps/web/lib/api-client/client.ts`: an `openapi-fetch` client instance configured with `baseUrl: "/api"`, matching the existing nginx proxy behavior (`/api/` → `http://api:3000/`) so behavior is unchanged between dev and the static-export + nginx production setup.
- `packages/shared-types` is untouched — it remains the hand-written source for types shared across `apps/web` and `apps/api` at the domain level (`Like`, `LikeCount`, `CreateLikeRequest`). The generated client is additive and local to `apps/web`.
- See ADR-001 for the full rationale, including the tradeoff of manual/CI-driven regeneration vs. automatic drift detection.

### Data fetching — TanStack Query
- Add `@tanstack/react-query` and `@tanstack/react-query-devtools`.
- `QueryClient` instantiated once and provided via the same client-side `Providers` wrapper used for `next-themes` (one client boundary, both providers nested inside it).
- Devtools rendered conditionally (`process.env.NODE_ENV !== "production"`).
- Replace the page's manual `fetchCount`/`submitLike` + `useState`/`useEffect` combo with:
  - a query for the like count (calls `GET /likes/count` through the typed client)
  - a mutation for submitting a like/story (calls `POST /likes` through the typed client), which invalidates/refetches the count query on success
- Loading and error states for both are surfaced through the query/mutation's own `isLoading`/`isError`/`error` state rather than hand-rolled `useState` flags.

### Forms — React Hook Form + Zod
- Add `react-hook-form`, `zod`, and `@hookform/resolvers`.
- Define a Zod schema for the story form:
  - `story`: optional string, no additional constraint (mirrors the API's `IsOptional`/`IsString`)
  - `hoursSaved`: optional number, must be non-negative when provided (stricter than the API's unconstrained `IsNumber`, per grill decision)
- Wire the form with `useForm` + `zodResolver`, rendered through shadcn/ui's `Form` component family (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`) so validation errors render inline per-field.
- On valid submit, call the TanStack Query mutation described above; on success, reset the form and collapse the "share a story" section (preserving current UX behavior).

### Page structure changes
- `app/layout.tsx`: add the `Providers` client wrapper (theme + query client), `suppressHydrationWarning` on `<html>`.
- New header component containing the theme toggle.
- `app/page.tsx`: rebuilt using shadcn/ui components, the typed-client-backed query/mutation, and the RHF+Zod form — same functional behavior as today (like button + count, expandable optional story form) with no new features added.

### No API contract changes
- The API's endpoints, DTOs, and validation rules are unchanged. The only addition on the `apps/api` side is the build-time `openapi.json` generation script — not a runtime endpoint.

## Testing Decisions

Per the grill decision, adding a test framework/tests to `apps/web` is out of scope for this plan — none exists today (no Vitest/Jest/RTL config), and introducing one is left to a separate follow-up plan. This plan is verified through manual exercise of the running app (dark mode toggle + persistence, like count load, like submission, story submission with valid and invalid `hoursSaved`, error states) rather than an automated suite.

If a test framework is introduced later, the natural seams for this feature would be: the Zod schema (pure function, trivially unit-testable), and the page/form behavior at the React Testing Library level (render, fill, submit, assert on the mocked typed-client call) — mocking at the `openapi-fetch` client boundary rather than mocking TanStack Query internals.

## Out of Scope

- Test framework and tests for `apps/web` (see above)
- Changes to API business logic, endpoints, or validation rules beyond the new `openapi.json` generation script
- Any page or form other than the existing single page — the app has exactly one of each
- CI/pipeline wiring for regenerating `openapi.json` automatically (regeneration is a manual/local step for this plan; staleness detection is a future improvement, noted in ADR-001)
- Any new backend features (auth, additional endpoints, etc.)

## Further Notes

- **Open question deferred to tickets/implementation**: exact shadcn/ui base color/theme preset (e.g. "neutral" vs "zinc") wasn't decided during grill — it's a cosmetic default with no architectural weight; implementation should pick shadcn's default (`neutral`) unless it looks obviously wrong once the header/dark-mode toggle is in place.
- **Risk**: `next.config.js` sets `output: "export"` (fully static export). All four additions (next-themes, TanStack Query, RHF, the typed client) are client-side-only concerns and compatible with static export as long as no Server Components/Route Handlers are introduced — implementation should keep everything under `"use client"` boundaries as the existing page already does.
- **Risk**: shadcn/ui's CLI may prompt interactively during `init` — implementation should check for a non-interactive/flag-based invocation to keep the step scriptable.

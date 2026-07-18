# Context: web-app-foundations

## What we're building
Foundational front-end tooling for `apps/web`: Tailwind v4 + shadcn/ui, dark mode (next-themes), TanStack Query + a typed API client generated from the NestJS OpenAPI spec, and React Hook Form + Zod — with the app's one existing page/form migrated onto all four.

## Key decisions
- Tailwind v4 + shadcn/ui installed together via shadcn init — see grill/ADR-002.md
- Dark mode via next-themes, default system preference, header toggle
- Typed API client: openapi-typescript + openapi-fetch, sourced from a static generated openapi.json (no live server needed) — see grill/ADR-001.md
- Client lives in apps/web/lib/api-client (not a shared workspace package)
- TanStack Query Devtools included, dev-only
- Existing page.tsx (like count + story form) is migrated onto Query + typed client + RHF/Zod + shadcn components
- Zod adds a non-negative bound on hoursSaved beyond the API's loose validation
- No test framework added — out of scope

## Current state
Phase: complete
Completed tickets: 01-styling-providers-foundation, 02-dark-mode-toggle, 03-typed-api-client-generation, 04-like-count-submission-query, 05-story-form-rhf-zod
Plan complete. Review round-1: 0 BLOCK, 6 DEBT (exported to plans/tech-debt/).

## Tickets
- 01-styling-providers-foundation — Tailwind v4 + shadcn/ui init, Providers wrapper, base shadcn components (prefactor, blocked by none) — DONE
- 02-dark-mode-toggle — next-themes + header toggle (blocked by 01) — DONE
- 03-typed-api-client-generation — apps/api openapi.json script + apps/web openapi-typescript/openapi-fetch client (blocked by none) — DONE
- 04-like-count-submission-query — TanStack Query wired to typed client for like count/submit (blocked by 01, 03) — DONE
- 05-story-form-rhf-zod — RHF + Zod story form via shadcn Form, wired to ticket 04's mutation (blocked by 01, 04) — DONE

## Load this session
- plans/20260718_152243-web-app-foundations/spec.md
- plans/coding-rules/INDEX.md and applicable rule files
- apps/web/app/page.tsx (full app — only page/component in the app)

## Gotchas
- `apps/web` uses `next.config.js` with `output: "export"` (fully static export) — no Next.js API routes or server-side rendering; all data fetching is client-side
- nginx (apps/web/nginx.conf) proxies `/api/` to the NestJS API container at `http://api:3000/` — the web app calls relative `/api/...` paths in production
- `apps/api` (NestJS) already has `@nestjs/swagger` wired up in `src/main.ts`, exposing docs at `/docs` — no OpenAPI JSON export or client generation is currently automated
- Shared types currently live in `packages/shared-types` (hand-written, workspace package), imported by both `apps/web` and `apps/api`
- Only one page exists (`app/page.tsx`) with one form (like/story submission) using local `useState`, manual `fetch`, and native HTML inputs — no form library, no query library yet (ticket 04/05 will replace this)
- **shadcn CLI (v4.13.1, current as of this plan) version quirk**: `shadcn init`'s new default preset system (`--defaults` → `base-nova`, and every other Nova/Vega/Maia/... preset under both `--base base` and `--base radix`) resolves to registry entries that are *empty stubs* for the `form` component — no RHF integration exists yet for the new preset styles. Only the classic style keys (`new-york-v4`, `new-york`, `default`) have a real `form.json` with `FormField`/`FormItem`/etc. Fix: hand-write `components.json` with `"style": "new-york-v4"` (classic, Tailwind v4, CSS-variable theming, Radix-based) instead of running `shadcn init` — `shadcn add <component>` respects whatever style is already in `components.json` even if `init` never ran. Also noticed `shadcn add` did not create `lib/utils.ts` (the `cn` helper) despite every component importing it — had to hand-write it (standard `clsx` + `tailwind-merge` one-liner). Matters for any future `shadcn add` call (e.g. ticket 02's toggle icon, or any new component pulled from the registry later) — check `components/ui/` and `lib/utils.ts` actually landed, don't assume `add` is fully self-sufficient with this CLI version.
- `components.json` → `baseColor: "neutral"`, `style: "new-york-v4"`. `apps/web/package.json`'s `shadcn` entry is pinned in devDependencies at `^4.13.1` for reference if this needs revisiting.
- Dark mode toggle (`components/theme-toggle.tsx`) uses `useTheme().resolvedTheme` and gates on a `isMounted` state before reading it, rendering a disabled placeholder button on first render — `resolvedTheme` is `undefined` during SSR/first client render and only resolves after next-themes reads `localStorage`/OS preference, so reading it immediately would either flash or mismatch hydration.
- No browser tool was available this session — ticket 02's acceptance criteria were verified via `tsc`/build passing and by inspecting the dev server's raw SSR HTML (confirmed the next-themes no-flash inline script and `suppressHydrationWarning` are present), not by an actual click-through in a browser. If a future session has browser tooling, worth a quick manual sanity check.
- No `ts-node`/`tsx` in this repo — `apps/api`'s `generate:openapi` script runs via plain compiled JS (`nest build && node dist/generate-openapi.js`), not a TS-direct runner. If a lighter-weight script runner is ever added to the repo, this could be simplified, but there was no reason to add a new dependency just for this one script.
- `apps/api/src/generate-openapi.ts` builds `AppModule` via `NestFactory.create` with no `app.listen(...)` and writes to `openapi.json` next to the compiled `dist/` output's parent (`apps/api/openapi.json`) using `join(__dirname, "..", "openapi.json")` — resolves correctly regardless of the cwd the script is invoked from.
- `openapi.json` and `lib/api-client/schema.d.ts` are generated artifacts but are meant to be checked into the repo (per ADR-001/glossary — "checked into the repo; source of truth for the typed client's generated types"), not gitignored. Regeneration is a manual/local step, not wired into CI (out of scope for this plan, noted in ADR-001).
- `apps/web/lib/api-client/client.ts` exports `apiClient = createClient<paths>({ baseUrl: "/api" })` from `openapi-fetch`, typed against `./schema` (the generated `paths` type) — this is the client ticket 04 wires TanStack Query through.
- `apps/web/lib/api-client/likes.ts` exports `useLikeCount()` and `useSubmitLike()` (TanStack Query hooks over `apiClient`) plus `likeCountQueryKey` — ticket 05's form should call `useSubmitLike()` for its `onSubmit`, passing `{ story, hoursSaved }`, rather than adding a new mutation.
- `app/page.tsx`'s story form (`isExpanded`/`story`/`hoursSaved` state, native `<textarea>`/`<input>`) was deliberately left un-migrated by ticket 04 — it already calls `submitLike.mutate(...)` from `useSubmitLike()`, but still uses native elements and manual state instead of RHF/Zod/shadcn `Form`. That native-to-RHF swap is ticket 05's entire job.
- No browser tool was available in the ticket 04 session either — verification was done via `tsc`/`next build` passing and via `docker compose up --build` + `curl` through the nginx `/api/` proxy confirming `GET /likes/count` and `POST /likes` work and the count increments, not by clicking the button in an actual browser. Same caveat likely applies to ticket 05 unless a future session has browser tooling.
- Full local stack (postgres + api + nginx-fronted static web) can be brought up with `docker compose up -d --build` from the repo root and torn down with `docker compose down`; nginx serves the static export on `localhost:8080` and proxies `/api/` to the NestJS container, matching production routing.
- `react-hook-form`, `zod`, and `@hookform/resolvers` were already in `apps/web/package.json`/`node_modules` before ticket 05 started (added during ticket 01's scaffolding, ahead of when they were needed) — no `pnpm add` was necessary for ticket 05.
- The story form's Zod schema (`app/page.tsx`) keeps `hoursSaved` typed as a plain `string` (not `number`) with a `.refine()` checking `Number(value) >= 0` when non-blank — deliberately avoided Zod's `preprocess`/`transform().pipe()` to get a numeric field type, since that requires `useForm`'s 3-generic `<TFieldValues, TContext, TTransformedValues>` form and the string→number conversion is cheap to do by hand in the submit handler (mirrors what the pre-RHF manual-fetch code already did). If a future ticket wants the schema itself to produce a `number`, this is the tradeoff to revisit.
- The API itself accepts negative `hoursSaved` (returns 201) — confirmed via direct curl — so the Zod non-negative bound in the web form is purely a client-side UX constraint, not backed by server-side validation. This matches the plan's documented intent (CONTEXT.md key decisions: "Zod adds a non-negative bound on hoursSaved beyond the API's loose validation") but means a non-browser API client can still submit negative values.

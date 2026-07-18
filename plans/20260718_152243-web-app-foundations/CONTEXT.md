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
Phase: implement
Completed tickets: none
Current ticket: plans/20260718_152243-web-app-foundations/tickets/01-styling-providers-foundation.md

## Tickets
- 01-styling-providers-foundation — Tailwind v4 + shadcn/ui init, Providers wrapper, base shadcn components (prefactor, blocked by none)
- 02-dark-mode-toggle — next-themes + header toggle (blocked by 01)
- 03-typed-api-client-generation — apps/api openapi.json script + apps/web openapi-typescript/openapi-fetch client (blocked by none)
- 04-like-count-submission-query — TanStack Query wired to typed client for like count/submit (blocked by 01, 03)
- 05-story-form-rhf-zod — RHF + Zod story form via shadcn Form, wired to ticket 04's mutation (blocked by 01, 04)

## Load this session
- plans/20260718_152243-web-app-foundations/spec.md
- plans/20260718_152243-web-app-foundations/tickets/01-styling-providers-foundation.md

## Gotchas
- `apps/web` uses `next.config.js` with `output: "export"` (fully static export) — no Next.js API routes or server-side rendering; all data fetching is client-side
- nginx (apps/web/nginx.conf) proxies `/api/` to the NestJS API container at `http://api:3000/` — the web app calls relative `/api/...` paths in production
- `apps/api` (NestJS) already has `@nestjs/swagger` wired up in `src/main.ts`, exposing docs at `/docs` — no OpenAPI JSON export or client generation is currently automated
- Shared types currently live in `packages/shared-types` (hand-written, workspace package), imported by both `apps/web` and `apps/api`
- `apps/web` currently has zero CSS/styling setup — no Tailwind, no global stylesheet, no component library
- Only one page exists (`app/page.tsx`) with one form (like/story submission) using local `useState`, manual `fetch`, and native HTML inputs — no form library, no query library yet

# Requirements: web-app-foundations

## Problem

`apps/web` is a bare-bones Next.js 15 static-export app: zero styling framework, no dark mode, a single page that manually wires `fetch` + `useState` for data loading and form submission, and no form validation library. This plan lays down four pieces of foundational front-end tooling so future feature work has a real base to build on.

## Solution

1. **Styling** — Install Tailwind CSS v4 and shadcn/ui together via shadcn's init flow.
2. **Dark mode** — Add `next-themes`, defaulting to system preference with a user-overridable toggle in a new lightweight header.
3. **Data fetching** — Add TanStack Query plus a typed API client generated from the NestJS API's OpenAPI spec (`openapi-typescript` + `openapi-fetch`), replacing manual `fetch`/`useState` calls.
4. **Forms** — Add React Hook Form + Zod, and migrate the app's one existing form onto it.

The existing page (`app/page.tsx` — like count + optional story/hoursSaved submission) is rebuilt end-to-end on top of all four: shadcn/ui components, TanStack Query for the count fetch and like/story mutation, RHF + Zod for the story form.

## Done looks like

- `apps/web` has Tailwind v4 + shadcn/ui configured (`components.json`, theme tokens, at least Button/Input/Textarea/Form/Label components installed)
- A header with a working light/dark/system toggle appears on the page; theme persists across reloads with no flash of wrong theme
- `apps/api` has a script that generates a static `openapi.json` without needing a running server
- `apps/web/lib/api-client` contains generated types + an `openapi-fetch` client built from that spec
- A `QueryClientProvider` wraps the app; devtools appear in dev only
- The like-count fetch and like/story submission on the existing page go through TanStack Query + the typed client, not raw `fetch`
- The story form is built with React Hook Form + Zod validation (including a non-negative `hoursSaved` bound) and shadcn/ui form components
- Everything still works under `next build` with `output: "export"` (static export) — no server-only APIs introduced client-side

## Out of scope

- No test framework or tests added to `apps/web` (none exists today; separate follow-up)
- No changes to API business logic beyond the new OpenAPI-export script
- No other pages or forms — the app has exactly one page and one form today
- No CI/pipeline changes

# Decisions: web-app-foundations

## Decision: Tailwind v4 + shadcn/ui installed together
Decided: Use shadcn's init flow to install and configure Tailwind CSS v4 and shadcn/ui in one pass.
Why: The app has zero existing CSS setup, so there's no legacy Tailwind config to reconcile with. v4 + shadcn together is the currently recommended path for Next.js 15 / React 19 apps.
Alternatives rejected: Tailwind v3 (no reason to pick the older major with a greenfield setup); a non-Tailwind styling approach (shadcn/ui requires Tailwind).

## Decision: Dark mode via next-themes, default system
Decided: Use `next-themes` for theme switching. Default to OS/system preference; user can override, override persists (localStorage). Toggle lives in a new lightweight header/nav (the app has none today).
Why: `next-themes` is the standard shadcn/ui pairing — handles the `class` strategy and avoids flash-of-wrong-theme on load. System default is the least surprising starting point for a public-facing page.
Alternatives rejected: default light / default dark (less respectful of user OS preference); floating toggle without a header (header is a reasonable place to grow future nav into anyway).

## Decision: Typed API client via openapi-typescript + openapi-fetch
Decided: Generate TypeScript types from the NestJS API's OpenAPI spec with `openapi-typescript`, and call the API through `openapi-fetch` as a thin typed wrapper. No generated hooks/SDK — TanStack Query wraps the typed calls directly.
Why: Lightweight, framework-agnostic, no generated code beyond types + a thin client to review and maintain. Keeps query-hook logic hand-written and explicit rather than codegen'd.
Alternatives rejected: orval (generates a fuller SDK incl. TanStack Query hooks — more codegen surface than needed for one API with a handful of endpoints); continuing to hand-write the client against `@thanks-claude/shared-types` (loses compile-time drift detection between API and client).
See: ADR-001.

## Decision: Static openapi.json as the codegen source
Decided: Add a script in `apps/api` that builds the Nest app and writes the OpenAPI document to a checked-in `openapi.json` file, without requiring a running server. `apps/web`'s `openapi-typescript` command reads from that file.
Why: Reproducible in CI and local dev without needing to boot the API and a database just to regenerate types.
Alternatives rejected: pointing `openapi-typescript` at a live server URL (e.g. `localhost:3000/docs-json`) — simpler wiring but requires a running API (and DB connection) whenever types are regenerated.

## Decision: Typed API client location
Decided: New `apps/web/lib/api-client` (generated types + `openapi-fetch` instance), local to the web app.
Why: `apps/web` is the only consumer today; a new workspace package would be overhead with no second consumer to justify it.
Alternatives rejected: putting it in `packages/shared-types` (mixes hand-written domain types with generated client code); a new `packages/api-client` workspace package (premature — no second consumer yet).

## Decision: TanStack Query Devtools, dev-only
Decided: Include `@tanstack/react-query-devtools`, rendered only outside production.
Why: Useful during active development of query logic; negligible cost to include since it's excluded from prod builds.

## Decision: Migrate existing page to TanStack Query + typed client
Decided: The like-count fetch and like/story submission in `app/page.tsx` are migrated off manual `fetch`/`useState` onto TanStack Query + the new typed client.
Why: It's the only page/form in the app — leaving it on the old pattern while introducing new tooling elsewhere would mean the new tooling has no real usage and the app carries two competing data-fetching patterns.

## Decision: Zod schema adds sensible bounds beyond the API
Decided: The story form's Zod schema requires `hoursSaved` to be non-negative when provided. `story` stays a free-form optional string, mirroring the API's `IsString`/`IsOptional`.
Why: The API's `class-validator` rules (`IsOptional`, `IsNumber`) are loose and allow negative hours, which isn't real-world meaningful. Catching it client-side is cheap and improves UX; the API remains the authoritative boundary check.
Alternatives rejected: mirroring the API's validation exactly with no added bounds.

## Decision: Restyle existing form/page with shadcn/ui components
Decided: Replace the native `<button>`/`<input>`/`<textarea>`/`<form>` elements on the page with shadcn/ui's `Button`, `Input`, `Textarea`, and `Form` (RHF-integrated) components.
Why: Otherwise shadcn/ui is installed as pure infrastructure with nothing in the app actually using it.

## Decision: No test framework added
Decided: Out of scope for this plan. `apps/web` has no Vitest/Jest/RTL setup today; adding one is left to a separate follow-up plan.
Why: Keeps this plan focused on introducing the four requested tooling pieces rather than expanding scope into test infrastructure.

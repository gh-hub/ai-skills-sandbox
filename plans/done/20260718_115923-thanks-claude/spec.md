# Spec: thanks-claude

## Problem Statement

There's no lightweight, real product to exercise the dev-workflow skill end-to-end. We need something small enough to build in a single plan, but real enough to touch a full stack: a static frontend, an API, a database, and shared types across a monorepo.

Separately, there's no simple way for a visitor to say "thank you" to Claude — to register appreciation and, optionally, share a short story about how Claude helped them and how much time it saved.

## Solution

A single-page site with a "like" button and a running total of likes. Clicking the button always records a new like (repeat likes are allowed and expected — this measures thank-yous, not unique visitors). Next to the button, an optional expandable box lets the visitor write a free-text story and enter the number of hours Claude saved them before submitting. The whole stack runs locally via Docker Compose: a static Next.js frontend served by nginx, a NestJS API backed by Postgres via Drizzle, and a shared types package used by both apps.

## User Stories

1. As a visitor, I want to see the current total like count when I load the page, so that I know how many people have said thanks.
2. As a visitor, I want to click a like button and have it register immediately, so that I can say thank you with minimal friction.
3. As a visitor, I want the displayed count to reflect my like right after I click it, so that I get confirmation the action worked.
4. As a visitor, I want to optionally open a box to add a short story about what Claude helped me with, so that I can share more than a click.
5. As a visitor, I want to optionally enter how many hours Claude saved me, so that I can quantify the impact.
6. As a visitor, I want the story and hours-saved fields to be optional, so that I'm not blocked from liking if I don't want to write anything.
7. As a visitor, I want to be able to like more than once (e.g., on separate visits or thank-yous), so that repeat gratitude isn't silently discarded or blocked.
8. As a developer, I want the API's request/response shapes documented via Swagger, so that the contract is discoverable without reading source.
9. As a developer, I want request bodies validated at the API boundary, so that malformed data is rejected before touching the database.
10. As a developer, I want the frontend and API to share TypeScript types for the like/story shape, so that the contract can't silently drift between apps.
11. As a developer, I want the entire stack runnable with a single Docker Compose command, so that local setup is trivial.
12. As a developer, I want basic automated tests around like creation and count retrieval, so that the core flow has a regression safety net.

## Implementation Decisions

- **Monorepo layout:** `apps/api` (NestJS), `apps/web` (Next.js, static export), `packages/shared-types` (or similar name) holding the shared like/DTO shape. See ADR-001.
- **Workspace tooling:** pnpm workspaces only — no Turborepo/Nx.
- **Data access:** Drizzle ORM against Postgres; drizzle-kit owns schema migrations.
- **Schema:** single `likes` table — `id` (uuid, pk), `created_at` (timestamptz, default now), `story` (text, nullable), `hours_saved` (numeric, nullable). No dedup key, no user/session identity.
- **API contract:**
  - `POST /likes` — body `{ story?: string; hoursSaved?: number }`, both fields optional, validated via a `CreateLikeDto` (`class-validator`/`class-transformer`). Returns the created like record.
  - `GET /likes/count` — returns `{ count: number }`, the total row count of `likes`.
  - Global `ValidationPipe` (whitelist + transform) applied at bootstrap so unexpected fields are stripped and types are coerced.
  - `@nestjs/swagger` mounted at `/api/docs`, generated from the same DTOs used for validation.
- **Frontend:** Next.js with `output: 'export'` (fully static, no Node server at runtime). Calls `POST /api/likes` and `GET /api/likes/count` relative to its own origin — no hardcoded backend host.
- **Serving / networking:** Docker Compose with three services: `postgres`, `api` (NestJS on its own internal port), `web` (nginx serving the static export and reverse-proxying `/api/*` to `api`). The browser only ever talks to the `web` origin; no CORS configuration needed on the API.
- **Shared types:** the like shape (request body and response record) is defined once in `packages/shared-types` and imported by both `apps/api` DTOs/entities and `apps/web` fetch calls, so the two apps can't drift on field names/types.
- **Migrations at startup:** the API container's startup sequence must apply pending Drizzle migrations before serving traffic (documented as an explicit ticket-level decision — either a startup script or a documented manual step, per ADR-001 consequences).
- **UI behavior:** the like button and total count live on the same view. Clicking like optimistically or immediately re-fetches/increments the displayed count. The story/hours-saved box is collapsed by default and expands on user action; submitting it is the same `POST /likes` call carrying the extra fields, not a separate endpoint.

## Testing Decisions

- Test at the API boundary (HTTP layer), not internals: exercise `POST /likes` and `GET /likes/count` against a real (or test-container) Postgres instance, asserting on response shape and on count changes after creation — this is the highest seam available since there's no pre-existing test harness in this greenfield repo to match.
- Cover: creating a like with no body fields, creating a like with story + hoursSaved, creating multiple likes and confirming `GET /likes/count` reflects the total, and a validation-rejection case (e.g. wrong type for `hoursSaved`) returning a 400.
- DTO validation itself is exercised indirectly through the rejection-case API test rather than unit-tested in isolation, since the validation pipe is what actually guards the boundary.
- Frontend testing is out of scope for automated coverage in this plan (manual verification only) — no existing frontend test seam exists yet and the grill didn't call for one; revisit if a future plan adds more UI surface.

## Out of Scope

- Authentication or user accounts of any kind.
- Admin dashboard or any public listing/wall of submitted stories — stories are stored but never displayed back.
- Duplicate-like prevention, client-side or server-side (no localStorage flag, no session/cookie dedup).
- CI/CD pipeline.
- Cloud deployment configuration — Docker Compose for local use only.
- Automated frontend/UI tests.

## Further Notes

- Open question (not resolved by grill): whether Drizzle migrations run automatically on API container start or require a manual step — ADR-001 flags this as a ticket/implementation-time decision. The tickets phase should settle it explicitly.
- The exact `packages/shared-types` package name is unresolved; tickets phase should fix a concrete name.
- Because this is a from-scratch monorepo, "prior art in the codebase" for tests doesn't exist yet — the first ticket that adds API tests effectively sets the pattern for the ones after it.

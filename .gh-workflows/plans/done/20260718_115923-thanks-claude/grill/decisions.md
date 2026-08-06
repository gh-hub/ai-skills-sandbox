## Decision: Monorepo tooling
Decided: pnpm workspaces only, no Turborepo/Nx.
Why: Keep it very basic per user request; pnpm workspaces alone is enough to link `apps/*` and `packages/*` and share types.
Alternatives rejected: pnpm + Turborepo (more config than needed right now), npm workspaces (slower, weaker workspace protocol).

## Decision: ORM
Decided: Drizzle ORM for the NestJS API's Postgres access.
Why: User's explicit choice over Prisma/TypeORM.
Alternatives rejected: Prisma, TypeORM, raw SQL.

## Decision: Feedback data shape
Decided: One free-text "story" field (covers "what I loved" + "how it helped" as a single narrative) plus a separate "hours saved" field.
Why: Matches how the user described the box; avoids forcing three separate inputs.
Alternatives rejected: single free-text box only (no structure for time saved), three separate fields (over-structured for the ask).

## Decision: Hours-saved input type
Decided: Free number input (hours), not a preset dropdown.
Why: User's explicit preference for precision over guardrails.
Alternatives rejected: preset dropdown/enum.

## Decision: Duplicate likes
Decided: No prevention, client-side or server-side. Every click creates a new row.
Why: User clarified this is intentional — someone can say "thank you Claude" more than once.
Alternatives rejected: localStorage flag, server-side session/cookie dedup.

## Decision: Public display
Decided: Show only a running total like count. Story text is stored but never displayed back publicly.
Why: Avoids needing any moderation for a skill-testing sandbox.
Alternatives rejected: public wall/feed of testimonials, no display at all.

## Decision: Static frontend serving
Decided: Next.js `output: 'export'` static build served by nginx in Docker; nginx reverse-proxies `/api/*` to the NestJS container.
Why: Keeps the frontend truly static (no Node server running) and avoids CORS by unifying the origin.
Alternatives rejected: nginx static + direct CORS calls to API container, plain Node static server (e.g. `serve`).

## Decision: API docs and validation
Decided: `@nestjs/swagger` for interactive API docs, `class-validator` + `class-transformer` on DTOs with a global `ValidationPipe`.
Why: User's explicit addition — documented, validated API surface.

## Decision: Testing scope
Decided: Include basic tests for the like-creation and count endpoints as part of this plan.
Why: User's explicit choice over deferring tests to a later plan.

## Decision: Scope boundary
Decided: No auth/accounts, no admin dashboard, no CI/CD, no cloud deployment config. Local Docker Compose only.
Why: Confirmed explicitly by user to keep this plan focused on the basic end-to-end flow.

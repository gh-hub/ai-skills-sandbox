# Requirements: api-env-config-validation

## Problem
`apps/api` (NestJS backend) reads environment variables directly via `process.env` at 4 scattered call sites, with no systematic validation. This was flagged during a style-alignment review against the `nestjs-service-style` skill as the one real gap in an otherwise-aligned codebase (controllers, services, utils, control flow all already conform).

## Solution
Add a `ConfigModule.forRoot({ isGlobal: true, validate })` with a Zod validation schema, and route all 4 flagged env-var reads through `ConfigService` instead of direct `process.env` access.

Zod was chosen (over NestJS's built-in Joi support) for consistency — `apps/web` already uses Zod for form validation elsewhere in this monorepo, and NestJS's `validate` hook works equally well with either library.

## Scope — exactly these 4 sites, no more
- `PORT` — `apps/api/src/main.ts:18`. Schema: number, optional, default `3000`. Refactor: read via `app.get(ConfigService)` in `main.ts`'s `bootstrap()`.
- `DATABASE_URL` — `apps/api/src/db/client.ts:5-7`. Schema: required non-empty string, no strict URL-format check (existing behavior doesn't validate format either, and different envs format it differently). Refactor: `DbModule` (`apps/api/src/db/db.module.ts`) gets an async factory building the `pg.Pool` from `ConfigService.get('DATABASE_URL')`, replacing the module-load-time `pool` singleton currently exported from `client.ts`.
- `JWT_SECRET` — `apps/api/src/apps/auth/jwt-secret.ts:3-7`. Schema: required non-empty string, no added length/strength policy (matches current behavior — no scope creep). Refactor: `AuthModule` (`apps/api/src/apps/auth/auth.module.ts`) switches `JwtModule.register({ secret: JWT_SECRET, ... })` to `JwtModule.registerAsync({ useFactory: (config: ConfigService) => ({ secret: config.get('JWT_SECRET'), signOptions: {...} }), inject: [ConfigService] })`, replacing the top-level `JWT_SECRET` constant computed at import time in `jwt-secret.ts`.
- `NODE_ENV` — `apps/api/src/apps/auth/auth.controller.ts:16` (inside `buildSessionCookieOptions()`). Schema: enum `development | test | production` — `test` must be included because Jest sets `NODE_ENV=test` automatically, confirmed by `auth.spec.ts`'s `beforeAll` hook. Refactor: inject `ConfigService` into `AuthController` and read `NODE_ENV` from it instead of `process.env` directly.

## Done looks like
- No remaining direct `process.env.PORT` / `process.env.DATABASE_URL` / `process.env.JWT_SECRET` / `process.env.NODE_ENV` reads in `apps/api/src` application code (test files that set `process.env.*` to seed values before the testing module compiles are unaffected — see Environment notes).
- App fails fast at bootstrap with a clear Zod validation error if any required env var is missing/malformed, same as today's behavior for `JWT_SECRET`/`DATABASE_URL` (today's failure is an ad hoc throw; after this change it's a structured Zod error from the same fail-fast point).
- All 4 vars readable through `ConfigService` from any provider that needs them.

## Out of scope
- Any env vars beyond these 4 — none others were found via grep across `apps/api/src`.
- Strengthening `JWT_SECRET`'s validation policy (e.g. minimum length/entropy checks) — not part of this fix.
- Adding `.env` file loading/`.env.example` — no `.env` files exist in `apps/api` today; this plan only adds validation of whatever's already in the process environment at boot, it doesn't change how env vars get there.
- Changes to any other part of `apps/api` (controllers/services/utils) — the earlier style review found those already aligned with `nestjs-service-style`.

## Environment notes
(facts looked up during grilling, so the spec phase doesn't need to re-confirm them)
- `apps/api/package.json` has no `@nestjs/config`, no `joi`, no `zod` dependency today — `@nestjs/config` and `zod` both need to be added. `zod` is already a dependency of `apps/web` (monorepo-wide precedent), NestJS v11 is in use (`@nestjs/common@^11.0.0`, `@nestjs/core@^11.0.0`).
- `apps/api/src/apps/auth/auth.module.ts` currently does `JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: SESSION_EXPIRY } })`, importing the `JWT_SECRET` constant from `jwt-secret.ts` (computed at module-import time from `process.env.JWT_SECRET`, throwing synchronously if missing).
- `apps/api/src/db/db.module.ts` is a `@Global()` module that does `{ provide: DATABASE_CONNECTION, useValue: db }`, where `db` is imported from `./client.ts` — `client.ts` builds a `pg.Pool` and `drizzle` instance at module-load time from `process.env.DATABASE_URL`.
- Test files (`auth.spec.ts`, `likes.spec.ts`, `roles.spec.ts`, `users.spec.ts`, `awards.spec.ts`) each set `process.env.DATABASE_URL` (from a `@testcontainers/postgresql` container) and `process.env.JWT_SECRET = "test-jwt-secret"` in their `beforeAll` hook, then dynamically `await import("../../app.module")` (deliberately deferred so the module-load-time `process.env` reads in `client.ts`/`jwt-secret.ts` see the values already set), then `Test.createTestingModule({ imports: [AppModule] }).compile()`. Since `ConfigModule`'s `validate` hook runs at that same compile step, no test changes are needed — the values are already in `process.env` by the time it runs.

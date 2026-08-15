## Problem Statement

`apps/api` (the NestJS backend) reads environment variables directly via `process.env` at 4 scattered call sites, with no systematic validation. This was flagged during a style-alignment review against the `nestjs-service-style` skill as the one real gap in an otherwise-aligned codebase (controllers, services, utils, and control flow were all already found aligned).

## Solution

Add a `ConfigModule.forRoot({ isGlobal: true, validate })` with a Zod validation schema, and route all 4 flagged env-var reads through `ConfigService` instead of direct `process.env` access.

Zod was chosen over NestJS's built-in Joi support for consistency — `apps/web` already uses Zod for form validation elsewhere in this monorepo, and NestJS's `validate` hook works equally well with either library.

## Implementation Decisions

- Add a Zod schema validating exactly 4 env vars:
  - `PORT` — number, optional, default `3000`
  - `DATABASE_URL` — required non-empty string, no strict URL-format check (existing behavior doesn't validate format either, and different environments format it differently)
  - `JWT_SECRET` — required non-empty string, no added length/strength policy (matches current behavior — no scope creep)
  - `NODE_ENV` — enum `development | test | production` (`test` is required because Jest sets `NODE_ENV=test` automatically, confirmed via `auth.spec.ts`'s `beforeAll` hook)
- Wire the schema into `ConfigModule.forRoot({ isGlobal: true, validate: (config) => schema.parse(config) })`, imported once in `AppModule`.
- `main.ts`'s `bootstrap()` reads `PORT` via `app.get(ConfigService)` instead of `process.env.PORT`.
- `AuthModule` switches `JwtModule.register({ secret: JWT_SECRET, ... })` to `JwtModule.registerAsync({ useFactory: (config: ConfigService) => ({ secret: config.get('JWT_SECRET'), signOptions: { expiresIn: SESSION_EXPIRY } }), inject: [ConfigService] })`, and the top-level `JWT_SECRET` constant/module-load-time throw in `jwt-secret.ts` is removed (the file itself may be removed if nothing else references it once the refactor lands).
- `DbModule` switches from `{ provide: DATABASE_CONNECTION, useValue: db }` (where `db` was built at module-load time in `client.ts` from `process.env.DATABASE_URL`) to an async factory that builds the `pg.Pool`/`drizzle` instance from `ConfigService.get('DATABASE_URL')` at Nest's module-init time instead of at import time.
- `AuthController` injects `ConfigService` and reads `NODE_ENV` from it inside `buildSessionCookieOptions()` instead of `process.env.NODE_ENV`.

## Testing Decisions

- Add one unit test for the Zod schema itself (missing required var → throws; valid config → parses; `PORT` defaults to `3000` when absent). Prior art for pure unit specs (no supertest, no real app bootstrap): `apps/api/src/db/schema.spec.ts`, `apps/api/src/apps/auth/auth.service.spec.ts`.
- No changes needed to the existing e2e specs (`auth.spec.ts`, `likes.spec.ts`, `roles.spec.ts`, `users.spec.ts`, `awards.spec.ts`) — each already sets `process.env.DATABASE_URL`/`process.env.JWT_SECRET` in `beforeAll` before dynamically importing `app.module` and compiling the testing module, so they exercise the new `ConfigModule` validation for free at that same compile step.

## Out of Scope

- Any env var beyond `PORT`, `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV` — none others were found via grep across `apps/api/src`.
- Strengthening `JWT_SECRET`'s validation policy (e.g. minimum length/entropy checks).
- Adding `.env` file loading or a `.env.example` — no `.env` files exist in `apps/api` today; this only validates whatever's already in the process environment at boot.
- Any change to controllers/services/utils outside the 4 flagged sites — already found aligned with `nestjs-service-style` in the earlier review.

## Further Notes

- `apps/api/package.json` has no `@nestjs/config` or `zod` dependency today — both need to be added.
- `jwt-secret.ts`'s current module-load-time throw and `client.ts`'s module-load-time `Pool`/`drizzle` construction are exactly the pattern this ticket replaces with DI-based, `ConfigService`-driven construction.

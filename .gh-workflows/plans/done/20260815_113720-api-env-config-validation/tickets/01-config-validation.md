# 01 — Add ConfigModule + Zod validation, refactor all 4 env-var sites to ConfigService

**What to build:** `apps/api` boots with fail-fast, schema-validated environment variables. `PORT`, `DATABASE_URL`, `JWT_SECRET`, and `NODE_ENV` are all read through `ConfigService` rather than direct `process.env` access; no direct `process.env.PORT`/`process.env.DATABASE_URL`/`process.env.JWT_SECRET`/`process.env.NODE_ENV` reads remain in application code (test files that seed `process.env.*` before compiling the testing module are unaffected).

**Blocked by:** None — can start immediately

**Status:** ready

- [x] Add `@nestjs/config` and `zod` as dependencies of `apps/api`
- [x] Define a Zod schema validating `PORT` (number, optional, default `3000`), `DATABASE_URL` (required non-empty string), `JWT_SECRET` (required non-empty string), `NODE_ENV` (enum `development | test | production`) — `apps/api/src/config/env.schema.ts`
- [x] Wire `ConfigModule.forRoot({ isGlobal: true, validate: (config) => schema.parse(config) })` into `AppModule`
- [x] `main.ts`: read `PORT` via `app.get(ConfigService)` instead of `process.env.PORT`
- [x] `AuthModule`: switch `JwtModule.register` to `JwtModule.registerAsync` with a `ConfigService`-injecting factory; remove the module-load-time `JWT_SECRET` constant/throw in `jwt-secret.ts` (file deleted — grep confirmed no other references)
- [x] `DbModule`: switch to an async factory building the `pg.Pool`/`drizzle` instance from `ConfigService.get('DATABASE_URL')`, replacing the module-load-time `pool`/`db` construction in `client.ts` (now `createDbClient(connectionString)`)
- [x] `AuthController`: inject `ConfigService`, read `NODE_ENV` from it in `buildSessionCookieOptions()` instead of `process.env.NODE_ENV`
- [x] Add a unit test for the Zod schema (missing required var throws; valid config parses; `PORT` defaults to `3000`) — `apps/api/src/config/env.schema.spec.ts`, all 3 pass
- [x] Existing test suite (`pnpm --filter @thanks-claude/api test` or equivalent) passes unmodified — 13 suites / 166 tests pass, including the testcontainers-backed e2e specs

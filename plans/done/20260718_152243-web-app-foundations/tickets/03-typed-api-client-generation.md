# 03 — Typed API client generation

**What to build:** In `apps/api`, add a script that builds the Nest application object in-process (no `app.listen(...)`, no port bind) and runs the same `DocumentBuilder`/`SwaggerModule.createDocument` sequence already used in `src/main.ts`, writing the result to `apps/api/openapi.json`, exposed as a `generate:openapi` package script. In `apps/web`, add `openapi-typescript` and `openapi-fetch` as dependencies, add a `generate:api-types` script that runs `openapi-typescript ../api/openapi.json -o lib/api-client/schema.d.ts`, and create `lib/api-client/client.ts`: an `openapi-fetch` instance configured with `baseUrl: "/api"`, matching the existing nginx proxy behavior.

**Blocked by:** None — can start immediately (independent of 01/02, must land before 04)

**Status:** ready

- [ ] `pnpm generate:openapi` in `apps/api` produces `openapi.json` without starting a server or requiring a DB connection beyond module graph construction
- [ ] `pnpm generate:api-types` in `apps/web` produces `lib/api-client/schema.d.ts` from that `openapi.json`
- [ ] `lib/api-client/client.ts` exports a configured `openapi-fetch` client instance typed against the generated schema, and the project type-checks
- [ ] `packages/shared-types` is untouched

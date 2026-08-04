# ADR-002: `src/apps/{feature}/` + Service/Repository Layering

## Status
Accepted

## Context
`apps/api` today organizes NestJS code as flat feature folders directly under `src/` (e.g. `src/likes/`), and within a feature, the controller does everything: it injects `DATABASE_CONNECTION`/`DbClient` directly, runs Drizzle queries inline, and also performs response-shaping/business logic (ISO date conversion, pagination math, calling `computeLikesStats`). Only one feature (`likes`) exists today, but the user wants to establish the organizational pattern the API will follow as more features are added, not just fix `likes` in isolation.

Two structural questions needed answers: where do feature folders live, and how is logic split within a feature.

## Decision

1. **Feature folder location: `src/apps/{feature}/`, root bootstrap stays at `src/` root.** Feature modules relocate under a new `src/apps/` namespace (starting with `src/apps/likes/`). Root-level NestJS bootstrap/shared infrastructure (`main.ts`, `app.module.ts`, `app.controller.ts`, `db/`, `generate-openapi.ts`) is explicitly *not* moved — it isn't a feature, and forcing it into `src/apps/` (e.g. as a fake "root app" or "shared app") would blur the meaning of that namespace. `src/apps/` means "one folder per product feature," nothing else.

2. **Within a feature: repository → service → controller, one direction of dependency.** Each feature gets three layers:
   - `{feature}.repository.ts`: the only file allowed to import the DB client, DB connection token, and schema table(s) for that feature; issues raw Drizzle queries (insert/select/count/sum, where/orderBy/limit/offset) and returns raw rows. No business logic.
   - `{feature}.service.ts`: owns all business logic — calls the repository for data, does computation/shaping (date formatting, pagination math, calling pure utils like `computeLikesStats`), and is what the controller calls.
   - `{feature}.controller.ts`: HTTP/routing only — decorators, DTO validation in/out, delegates to the service. No DB access, no business logic.

   This builds on the project's existing `nestjs-service-style` skill guidance ("keep controllers thin," "prefer focused services") by adding an explicit repository layer underneath the service, so DB access is isolated from business logic as well as from HTTP concerns. Pure-function utils (like `computeLikesStats`) keep their existing role and just get called from the service layer instead of the controller.

3. **Testing gets both an integration layer and new unit layers.** The existing `likes.spec.ts` integration test (testcontainers + supertest against real HTTP endpoints) already exercises all three layers together and is preserved as-is after relocation — no coverage is lost by the restructure alone. On top of that, new unit tests are added for the service (mocking the repository) and the repository (mocking the DB client), giving fast, isolated coverage of the new layers that the integration test alone wouldn't pinpoint on failure.

## Consequences
- Adding a new feature to `apps/api` in the future means creating `src/apps/{feature}/` with the same four-file shape (controller/service/repository/module) plus `dto/`, rather than inventing a new organization each time.
- Controllers and repositories become easier to unit test in isolation because each has a single, narrow responsibility with a clear mockable boundary (service mocks the repository; repository tests mock the DB client).
- The DI wiring in `{feature}.module.ts` grows by one provider (the repository) per feature; this is mechanical and not expected to cause friction.
- This ADR only restructures `likes`. No other feature exists yet, so there's no immediate second data point proving the pattern generalizes cleanly — that risk is accepted and will surface (and be corrected if needed) the next time a feature app is added.
- The HTTP contract (routes, request/response shapes) is unchanged — this is purely an internal code-organization change.

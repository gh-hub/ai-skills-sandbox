# 03 — Split `likes` into repository/service/controller + unit tests

**What to build:** Within the now-relocated `apps/api/src/apps/likes/`, extract the current controller's responsibilities into a repository layer and a service layer. `likes.repository.ts` becomes the only file that imports `DATABASE_CONNECTION`/`DbClient` and the `likes` schema table for this feature, exposing one method per raw Drizzle query the feature needs (insert, count, stats aggregate, count-with-story, paginated story select), each returning raw rows/values with no shaping. `likes.service.ts` calls the repository and owns all business logic currently inline in the controller — `createdAt` to ISO string conversion, pagination math (`totalPages`, `offset`), null-coalescing `sum()`'s result, and calling `computeLikesStats` — exposing one method per the controller's current public operations (create, get count, get stats, get paginated page). `likes.controller.ts` becomes thin: its existing decorators, Swagger annotations, and DTO bindings stay, but every method body becomes a single delegating call into the service. `likes.module.ts` registers `LikesService` and `LikesRepository` as providers alongside `LikesController`. New unit tests are added for the service (repository mocked) and the repository (DbClient mocked), following this project's `nestjs-service-style` conventions. The HTTP contract (routes, request/response shapes, status codes) does not change.

**Blocked by:** 02 — relocate-likes-to-apps-folder

**Status:** ready

- [ ] `likes.repository.ts` exists and is the only file in the feature that imports `DbClient`/`DATABASE_CONNECTION`/the `likes` schema table; each of its methods issues exactly one Drizzle query and returns raw rows/values with no shaping logic
- [ ] `likes.service.ts` exists and performs all business logic previously inline in the controller (ISO date formatting, pagination math, `sum()` null-coalescing, calling `computeLikesStats`), calling only the repository for data
- [ ] `likes.controller.ts` contains no direct DB imports and no business-logic computation; every method body is a single delegating call into `likes.service.ts`, with its existing routes, Swagger decorators, and DTO bindings unchanged
- [ ] `likes.module.ts` registers `LikesController` and providers `LikesService`, `LikesRepository`
- [ ] New unit tests for `likes.service.ts` exist, mocking `LikesRepository`, asserting correct output shaping (ISO dates, `totalPages`/`offset` math, `computeLikesStats` inputs/outputs) from given raw repository return values
- [ ] New unit tests for `likes.repository.ts` exist, mocking the `DbClient`, asserting each method issues the expected query pattern and returns the DB client's raw result unmodified
- [ ] The relocated integration test (`likes.spec.ts`) still passes unchanged, proving the HTTP contract (routes, request/response shapes, status codes) is unaffected by the internal split
- [ ] `likes-stats.util.ts`'s implementation is unchanged; it is called only from `likes.service.ts`

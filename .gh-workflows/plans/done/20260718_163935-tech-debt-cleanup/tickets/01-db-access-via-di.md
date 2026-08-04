# 01 — apps/api: DB access via NestJS DI

**What to build:** A `DbModule` that provides the existing `db` client under a `DATABASE_CONNECTION` injection token and registers itself `@Global()`. `LikesController` and `AppController` receive the connection via constructor injection instead of importing the `db` singleton directly. `AppModule` imports `DbModule` once.

**Blocked by:** None — can start immediately

**Status:** done

- [x] `DbModule` exists (`apps/api/src/db/db.module.ts`), provides `db` from `db/client.ts` under `DATABASE_CONNECTION`, marked `@Global()`
- [x] `AppModule` imports `DbModule`
- [x] `LikesController` injects `DATABASE_CONNECTION` via `@Inject`, no longer imports `db` directly
- [x] `AppController` injects `DATABASE_CONNECTION` via `@Inject`, no longer imports `db` directly
- [x] `LikesModule` does not need its own `DbModule` import (relies on global registration) — confirmed, no change needed
- [x] Existing `likes.spec.ts` end-to-end tests (real Postgres via testcontainers) pass unchanged in spirit — `POST /likes` and `GET /likes/count` still exercised through the HTTP layer; all 4 tests pass

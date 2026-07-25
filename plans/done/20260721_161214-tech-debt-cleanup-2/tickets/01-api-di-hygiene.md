# 01 — API DI hygiene

**What to build:** The API's `DATABASE_CONNECTION` DI wiring is consistent and self-documenting: `likes.spec.ts` acquires its cleanup handle through the same token the app resolves at request time (not a raw import), `AppController` and `LikesController` share one exported `DbClient` type instead of each repeating `import type { db as Database } from ...`, and `LikesModule` explicitly imports `DbModule` in its `@Module(...)` decorator instead of relying solely on `@Global()` registration.

**Blocked by:** None — can start immediately

**Status:** done (2026-07-21)

- [x] `apps/api/src/likes/likes.spec.ts` resolves its Postgres `Pool` cleanup handle via `moduleRef.get(DATABASE_CONNECTION).$client` instead of `import { pool } from "../db/client"`; all 5 existing `it(...)` blocks still pass unmodified
- [x] `apps/api/src/db/db.module.ts` exports `export type DbClient = typeof db;`
- [x] `apps/api/src/app.controller.ts` and `apps/api/src/likes/likes.controller.ts` both import `DbClient` from `../db/db.module` for their `@Inject(DATABASE_CONNECTION)` constructor parameter type, and no longer have a separate `import type { db as Database } from ".../db/client"` line
- [x] `apps/api/src/likes/likes.module.ts`'s `@Module(...)` decorator has `imports: [DbModule]`
- [x] Full existing `likes.spec.ts` suite passes after all three changes — **verified live** (Docker became available mid-session): 5/5 pass, reproduced twice.

**Regression found and fixed during live verification (not left as debt):** the first implementation added `import { DATABASE_CONNECTION, type DbClient } from "../db/db.module";` as a **static** top-level import in `likes.spec.ts`. Since `db.module.ts` statically imports `db/client.ts`, which constructs `new Pool({ connectionString: process.env.DATABASE_URL })` at module-load time, that static import caused the `Pool` to be built with `DATABASE_URL` still unset (module load happens before `beforeAll` sets it from the Testcontainers instance) — baking in a connection to the default `localhost:5432`, which nothing listens on. All DB-touching tests then failed with `ECONNREFUSED`. Confirmed via bisection (reverting each changed file one at a time) that this was caused specifically by the static `DATABASE_CONNECTION` import, not by the DbModule/controller changes. Fix: keep `type DbClient` as a type-only import (erased at compile time, safe to stay static) but defer the `DATABASE_CONNECTION` value import into `beforeAll` alongside the existing dynamic `AppModule` import: `const { DATABASE_CONNECTION } = await import("../db/db.module");`. Re-verified 5/5 passing after the fix.

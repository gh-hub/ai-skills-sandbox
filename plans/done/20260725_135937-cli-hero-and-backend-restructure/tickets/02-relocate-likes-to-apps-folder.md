# 02 — Relocate `likes` feature to `src/apps/likes/`

**What to build:** A purely mechanical relocation of the API's `likes` feature from `apps/api/src/likes/` to `apps/api/src/apps/likes/`, with no behavior or logic change. Every file currently under `src/likes/` (`likes.controller.ts`, `likes.module.ts`, `likes-stats.util.ts`, `likes.spec.ts`, `dto/`) moves to the new path, with all relative import paths fixed for the new depth (e.g. `../db/db.module` becomes `../../db/db.module`). `apps/api/src/app.module.ts`'s `LikesModule` import changes from `./likes/likes.module` to `./apps/likes/likes.module`. Root-level bootstrap files (`main.ts`, `app.module.ts`, `app.controller.ts`, `db/`, `generate-openapi.ts`) stay at `src/` root, untouched beyond the one import-path fix in `app.module.ts`. This establishes the `src/apps/{feature}/` namespace that future feature apps will follow, ahead of the repository/service split in ticket 03.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `apps/api/src/likes/` no longer exists; all its files now live under `apps/api/src/apps/likes/` in the same relative arrangement (`dto/` subfolder preserved)
- [ ] Every relative import inside the moved files is corrected for the new directory depth (e.g. references to `../db/db.module`, `../db/schema`)
- [ ] `apps/api/src/app.module.ts` imports `LikesModule` from `./apps/likes/likes.module`
- [ ] No file's exported behavior, decorators, DTO shapes, or logic changes — this ticket is a move plus import-path fixes only
- [ ] The relocated `likes.spec.ts` (including its dynamic `import("../app.module")` and `migrationsFolder` path) is updated for its new relative depth and passes unchanged in behavior
- [ ] The full API test suite (including the relocated integration test) passes

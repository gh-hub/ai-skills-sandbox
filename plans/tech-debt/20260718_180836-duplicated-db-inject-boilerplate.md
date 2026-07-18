# duplicated-db-inject-boilerplate

## Finding
`AppController` and `LikesController` duplicate identical DI boilerplate (`import type { db as Database } from "../db/client"` + `@Inject(DATABASE_CONNECTION) private readonly db: typeof Database`); aliasing a value import as `Database` also reads as a Mysterious Name. A shared exported type (e.g. `export type DbClient = typeof db`) would fix both. (Standards)

## Source
- Plan: plans/done/20260718_163935-tech-debt-cleanup/
- Round: round-1
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-18

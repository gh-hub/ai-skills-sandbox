## DEBT finding
A tech-debt item logged by dev-workflow's review phase to `review/tech-debt.md` and exported to `plans/tech-debt/` when its originating plan archived (see `plan-structure.md`).

## DATABASE_CONNECTION token
The NestJS DI token defined in `apps/api/src/db/db.module.ts` that provides the Drizzle `db` instance to controllers via `DbModule`'s `@Global()` registration.

## Accepted debt
A backlog item deliberately left unfixed and untouched in `plans/tech-debt/` after a `/debt-workflow` run, rather than carried into the new plan — distinct from an item discarded for being stale/fixed/duplicate.

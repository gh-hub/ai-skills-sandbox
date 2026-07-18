# 02 — apps/api: Env var boundary check + test assertion split

**What to build:** `drizzle.config.ts` fails fast with a descriptive error when `DATABASE_URL` is unset, instead of letting `undefined` flow silently into `drizzle-kit`. Separately, the `likes.spec.ts` test that currently asserts two unrelated things in one case is split into two independently-named tests.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `drizzle.config.ts` explicitly checks `process.env.DATABASE_URL` and throws a descriptive error (e.g. `"DATABASE_URL is required"`) before constructing the config object, replacing the `!` non-null assertion
- [ ] Manually verified: running `pnpm db:generate`/`db:migrate` with `DATABASE_URL` unset throws the new descriptive error instead of drizzle-kit's own cryptic failure
- [ ] Manually verified: running with `DATABASE_URL` set still works as before
- [ ] `likes.spec.ts`'s "creates a like with no body fields" test is split into two tests, each named for the scenario it asserts (not "part 1/part 2")
- [ ] One split test asserts the `story`/`hoursSaved` shape via `toMatchObject`
- [ ] One split test asserts `id` is a string
- [ ] Full test suite passes against the real Postgres testcontainer

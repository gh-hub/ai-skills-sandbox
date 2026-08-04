# 01 — Schema & seed data

**What to build:** New `awards` table (id uuid PK default random, createdAt timestamptz default now, title text required, description text required, icon text optional/nullable) and a new many-to-many join table `like_awards` (id uuid PK, like_id uuid required FK -> likes.id ON DELETE CASCADE, award_id uuid required FK -> awards.id ON DELETE CASCADE — this asymmetric cascade on both FKs is deliberate, do not copy the non-cascading `likes.userId -> users.id` pattern). One Drizzle migration (next number after `0002_brainy_tusk.sql`) that creates both tables AND seeds exactly these 7 awards in `awards`:
1. icon: 🐛, title: "Bug Slayer", description: "Squashed a nasty bug that had been haunting the codebase"
2. icon: ⚡, title: "Speed Demon", description: "Shipped something impressively fast"
3. icon: 🧠, title: "Clean Code", description: "Wrote code so clean it made someone smile"
4. icon: 🛟, title: "Lifesaver", description: "Saved the day right before a deadline or outage"
5. icon: 🎨, title: "Creative Genius", description: "Came up with a solution nobody else thought of"
6. icon: 📚, title: "Patient Teacher", description: "Explained something clearly and patiently"
7. icon: 🔧, title: "Refactor Royalty", description: "Turned a mess into something maintainable"

**Blocked by:** None — can start immediately

**Status:** ready

- [x] `awards` table exists in `apps/api/src/db/schema.ts` with the columns above
- [x] `like_awards` join table exists in `apps/api/src/db/schema.ts` with the FK/cascade behavior above
- [x] A Drizzle migration file creates both tables and seeds the 7 awards listed above — `apps/api/drizzle/0003_nice_sir_ram.sql`, generated via `pnpm --filter api db:generate` then hand-appended with the 7 `INSERT` rows (drizzle-kit only generates DDL, not seed data)
- [x] Running the migration against a fresh database results in exactly 7 rows in `awards` matching the list above — verified by an integration test (`apps/api/src/db/schema.spec.ts`) that spins up a real Postgres via testcontainers, runs all migrations, and asserts the 7 seeded rows
- [x] Deleting a row from `awards` (in a quick manual/test check) cascades to remove any `like_awards` rows referencing it, without touching any `likes` row — covered by the same test file
- [x] Deleting a row from `likes` cascades to remove any `like_awards` rows referencing it — covered by the same test file

**Implementation notes:**
- New `awards` and `likeAwards` tables added to `apps/api/src/db/schema.ts` (both FKs on `like_awards` use `onDelete: "cascade"`, matching the ticket's asymmetric-cascade requirement — this deliberately does not follow the existing non-cascading `likes.userId -> users.id` pattern).
- Migration `apps/api/drizzle/0003_nice_sir_ram.sql`: DDL for both tables (via `db:generate`) plus a manually-appended `INSERT` seeding the 7 awards.
- Verification test `apps/api/src/db/schema.spec.ts` follows the existing testcontainers pattern from `likes.spec.ts` — full Postgres 16 container, real migration run, real cascade deletes (no mocking).
- Side effect discovered and fixed: the new `like_awards -> likes` FK made the existing `TRUNCATE TABLE likes` in `likes.spec.ts`'s `GET /likes/stats` tests fail ("cannot truncate a table referenced in a foreign key constraint"). Fixed by changing it to `TRUNCATE TABLE likes CASCADE` — this is a pure test-fixture change, no product behavior change.
- Full backend test suite (57 tests) and `nest build` both pass after these changes.

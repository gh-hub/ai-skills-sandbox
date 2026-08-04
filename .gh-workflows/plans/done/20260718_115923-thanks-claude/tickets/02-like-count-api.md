# 02 — Like creation & count API

**What to build:** The full backend vertical slice for the like feature: a `likes` table, a validated `POST /likes` endpoint that always inserts a new row (story and hours-saved both optional, no dedup), a `GET /likes/count` endpoint returning the running total, Swagger docs for both, and tests covering the core flow. Demoable via curl or the Swagger UI at `/api/docs` — no frontend involved yet.

**Blocked by:** 01 — Monorepo & Docker Compose scaffold

**Status:** done

- [x] `likes` table exists via a Drizzle migration: `id` (uuid, pk), `created_at` (timestamptz, default now), `story` (text, nullable), `hours_saved` (numeric, nullable)
- [x] The Like shape (request body and response record) is defined once in `packages/shared-types` and used by both the API's DTO/entity and (later) the frontend
- [x] `POST /likes` accepts `{ story?: string; hoursSaved?: number }`, validated via a `CreateLikeDto` (`class-validator`/`class-transformer`), and always inserts a new row — no dedup logic, client or server side
- [x] `POST /likes` returns the created like record
- [x] `GET /likes/count` returns `{ count: number }` reflecting the total number of rows in `likes`
- [x] A global `ValidationPipe` (whitelist + transform) is applied at bootstrap — unexpected fields are stripped, types are coerced
- [x] `@nestjs/swagger` is mounted at `/api/docs` and documents both endpoints from the same DTOs used for validation
- [x] API tests exist for: creating a like with no body fields, creating a like with `story` + `hoursSaved`, creating multiple likes and confirming `GET /likes/count` reflects the total, and a validation-rejection case (e.g. wrong type for `hoursSaved`) returning a 400
- [x] All of the above is verifiable against the real Postgres service from the Docker Compose stack (or an equivalent test database), not a mock

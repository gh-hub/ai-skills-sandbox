# 02 — Aggregate stats API

**What to build:** A `GET /likes/stats` endpoint that computes an honest, aggregate picture of impact — total likes, the literal reported hours-saved sum, an estimated total extrapolated across everyone, and the percentage of likers who didn't report an hours-saved figure.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] `GET /likes/stats` exists on `LikesController`, computed on read from the existing `likes` table (no new table, column, or migration).
- [ ] Returns: `totalLikes`, `likesWithHoursReported`, `reportedHoursSaved` (sum of `hoursSaved` where present), `percentWithoutHoursReported`, `averageHoursPerReport` (`reportedHoursSaved / likesWithHoursReported`), `estimatedTotalHoursSaved` (`averageHoursPerReport × totalLikes`).
- [ ] `averageHoursPerReport` is `0` (not `NaN`/`Infinity`) when `likesWithHoursReported` is `0`.
- [ ] `percentWithoutHoursReported` is `0` (not `NaN`/`Infinity`) when `totalLikes` is `0`.
- [ ] Postgres `SUM`/aggregate null behavior over an empty set is handled explicitly (coerced to `0`, not left as `NULL`/`NaN`).
- [ ] New DTO added in `apps/api/src/likes/dto/`, following the existing `LikeDto`/`LikeCountDto` pattern.
- [ ] `packages/shared-types` gains the corresponding stats response type.
- [ ] Integration tests added to `apps/api/src/likes/likes.spec.ts` covering: correct math against a known set of seeded likes, and both zero-denominator cases (empty table; table with likes but none reporting hours).

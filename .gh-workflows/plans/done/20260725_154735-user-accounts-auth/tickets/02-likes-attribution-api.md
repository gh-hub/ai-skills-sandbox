# 02 — Likes attribution (API)

**What to build:** a nullable `user_id` column on the `likes` table
referencing `users.id`, added via an additive migration with no backfill —
every existing like/story stays anonymous. Creating a like/story consults
ticket 01's shared "current user or none" read: an authenticated request's
resulting row gets `user_id` set to that user's id, an anonymous request
leaves it null exactly as it does today, and there is no uniqueness
constraint or per-user limit either way — a logged-in visitor can like/share
as many times as they want, matching today's unlimited anonymous behavior.
The likes repository's feed query is extended to join `users` on
`likes.user_id` and expose the attributing user's display name (not the raw
user id) per feed item, null when there's no attributed user. The shared
`Like`/`LikesPage` types and the corresponding API DTOs gain this new
nullable name field. Covered by a repository-level test for the extended
join query, and an extension of the integration test suite proving that
creating a like/story with a valid session cookie attaches the right user
and surfaces that user's name on the feed, while doing so without a cookie
leaves both the row and the feed anonymous.

**Blocked by:** 01 — Users + auth API foundation

**Status:** ready

- [x] `likes.user_id` column added via additive migration, nullable, FK to `users.id`
- [x] Creating a like/story while authenticated sets `user_id` to the current user; doing so anonymously leaves it null
- [x] No uniqueness/dedup constraint — unlimited likes per user, same as anonymous today
- [x] Feed query joins to `users` and exposes the attributing user's name (or null) per item, without exposing the raw user id
- [x] Shared types and DTOs updated to carry the new field
- [x] Repository unit test and integration test coverage for both the attributed and anonymous paths

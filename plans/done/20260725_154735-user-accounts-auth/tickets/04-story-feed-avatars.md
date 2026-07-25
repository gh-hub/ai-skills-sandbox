# 04 — Web: story-feed avatars

**What to build:** the story feed renders, for each story, the shared
initials-avatar component from ticket 03 plus the attributing user's full
name when the feed item has one, and a `lucide-react` anonymous-person icon
when it doesn't — using the new per-item name field from ticket 02's feed
API — so attributed and anonymous stories are visually distinguishable at a
glance on the public feed.

**Blocked by:** 02 — Likes attribution (API), 03 — Web: login/signup modal + header auth state

**Status:** ready

- [x] Attributed stories show the shared initials avatar + the attributing user's full name
- [x] Anonymous stories show a lucide-react anonymous icon instead
- [x] The avatar styling is visually consistent with the header's avatar (same shared component, not a reimplementation)

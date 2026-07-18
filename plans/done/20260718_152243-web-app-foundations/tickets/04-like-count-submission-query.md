# 04 — Like count & submission via TanStack Query

**What to build:** Add `@tanstack/react-query` and `@tanstack/react-query-devtools`, instantiate a `QueryClient` once and provide it via `Providers` (devtools rendered only when `NODE_ENV !== "production"`). Replace the page's manual `fetchCount`/`submitLike`/`useState`/`useEffect` combo for the like button and count with a query for `GET /likes/count` and a mutation for `POST /likes` (empty body — story/hoursSaved arrive in ticket 05), both through the typed client from ticket 03. The mutation invalidates/refetches the count query on success. Loading and error states come from the query/mutation's own state, rendered through shadcn `Button`.

**Blocked by:** 01 — styling & providers foundation, 03 — typed API client generation

**Status:** ready

- [ ] Visiting the page loads and displays the current like count via the typed client
- [ ] Clicking "Like" submits via the typed client and the displayed count updates on success
- [ ] A failed count load shows a clear error message
- [ ] A failed like submission shows a clear error message
- [ ] Loading/error state is driven by TanStack Query state, not hand-rolled `useState` flags

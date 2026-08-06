# Progress: Admin User Management

## Base branch
`code-review-workflow`

## Current phase
review/round-1

## Current ticket path
(none)

## Phases
| Phase | Status | Date | Notes |
|---|---|---|---|
| grill | done | 2026-08-01 | |
| spec | done | 2026-08-01 | |
| tickets | done | 2026-08-04 | Six tickets in dependency order; start with 01 |

## Tickets
| Ticket | Status | Notes |
|---|---|---|
| `implement/01-roles-schema-migration` | done | 2026-08-04 — see `PROGRESS/notes/implement-01-roles-schema-migration.md` |
| `implement/02-roles-api` | done | 2026-08-04 — see `PROGRESS/notes/implement-02-roles-api.md` |
| `implement/03-users-api` | done | 2026-08-04 — see `PROGRESS/notes/implement-03-users-api.md` |
| `implement/04-admin-roles-page` | done | 2026-08-04 — see `PROGRESS/notes/implement-04-admin-roles-page.md` |
| `implement/05-admin-users-page` | done | 2026-08-04 — see `PROGRESS/notes/implement-05-admin-users-page.md`. Implementation-complete and code-reviewed; live e2e explicitly deferred (Docker flaky/killed two prior attempts on this ticket). |
| `implement/06-admin-navigation` | done | 2026-08-04 — see `PROGRESS/notes/implement-06-admin-navigation.md`. Built `/admin` hub + header link; ran the combined live e2e pass owed since ticket 04, found and fixed 6 real bugs (5 test-code, 1 a genuine regression in a pre-existing spec), full 58-test suite passing at the end. |

## Last session end-state
Ticket 06 (admin navigation) implemented: `/admin` hub page, header's conditional "Admin" link, and a new `admin-navigation.spec.ts` (9 tests). Docker was responsive this session, so the live e2e run owed since tickets 04/05 finally happened: ran the combined tickets 04+05+06 admin suite (27 tests) and then the full e2e suite (58 tests, all spec files) — both ended 100% passing. Getting there required fixing 6 real bugs surfaced live (not visible from code reading alone): an ambiguous accessible-name locator in this ticket's own new spec; an email-length limit and a session-cookie-clobbering bug in ticket 05's `admin-users-page.spec.ts` (the latter had silently broken 4 of that file's tests every time they ran); a fixed-literal test-admin-name collision against this same suite's own persisted-across-sessions Postgres volume; a headless-Chromium limitation where `page.bringToFront()` doesn't reliably fire the `visibilitychange` event React Query's focus-refetch depends on; and — the one true regression — this ticket's new header "Admin" link broke a pre-existing `auth-flow.spec.ts` test via an unscoped case-insensitive `getByText("ADMIN")` match. All are now fixed and passing. `apps/web`/`apps/e2e` `tsc --noEmit` and `apps/web next build` clean; `apps/api tsc --noEmit` clean (untouched). All 6 implement tickets are now done — phase is `review/round-1`, no round exists yet. See `PROGRESS/notes/implement-06-admin-navigation.md` for full detail and what the review phase should know.

# Glossary: e2e-ui-testing

**Core flows** — the three interactive flows in scope for v1: like button/count, story form (submit + validation error), dark mode toggle.

**Delta assertion** — a test assertion that checks a relative change (e.g. "count increased by 1") rather than an absolute value, used to keep tests stable against shared/persisted state.

**Suite run** — one full execution of the e2e test suite, from `docker compose up` through all tests to teardown. The unit at which the DB is reset (once), as opposed to per-test.

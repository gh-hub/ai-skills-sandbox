# e2e-stack-probe-partial-match-false-positive

## Finding
`isStackAlreadyRunning()` returns true if *any* container is running, not that the full `web`/`api`/`postgres` stack is up — a stale single leftover container (e.g. only `postgres` from a crash) makes teardown skip cleanup even though `docker compose up --build` started fresh containers. Spec's "reuse an already-running stack" implies the whole stack. (Spec)

## Source
- Plan: plans/done/20260718_192721-e2e-ui-testing/
- Round: round-2
- Category: Spec
- Logged: 2026-07-18
- Moved: 2026-07-19

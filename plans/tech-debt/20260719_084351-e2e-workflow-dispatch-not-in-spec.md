# e2e-workflow-dispatch-not-in-spec

## Finding
`.github/workflows/e2e.yml` adds a `workflow_dispatch` trigger not mentioned in the spec (which only calls for `pull_request` and `push` to `main`). Harmless, enables manual runs. (Spec)

## Source
- Plan: plans/done/20260718_192721-e2e-ui-testing/
- Round: round-1
- Category: Spec
- Logged: 2026-07-18
- Moved: 2026-07-19

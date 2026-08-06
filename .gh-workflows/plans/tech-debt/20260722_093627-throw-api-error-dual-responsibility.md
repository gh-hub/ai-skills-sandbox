# throw-api-error-dual-responsibility

## Finding
`apps/web/lib/api-client/likes.ts`'s `throwApiError(error, message)` helper both logs and throws — two responsibilities per the "a function does one thing" rule, though this is standard error-boundary handling and a net reduction in duplication.

## Source
- Plan: .gh-workflows/plans/done/20260721_161214-tech-debt-cleanup-2/
- Round: round-1
- Category: Standards
- Logged: 2026-07-22
- Moved: 2026-07-22

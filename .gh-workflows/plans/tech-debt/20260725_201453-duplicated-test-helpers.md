# duplicated-test-helpers

## Finding
`extractSessionCookie()` and `uniqueEmail()` test helpers are duplicated verbatim across `apps/api/src/apps/auth/auth.spec.ts` and `apps/api/src/apps/likes/likes.spec.ts` — candidate for a shared test-support module (e.g. `test/session.util.ts`).

## Source
- Plan: .gh-workflows/plans/done/20260725_154735-user-accounts-auth/
- Round: round-1
- Category: Standards
- Logged: 2026-07-25
- Moved: 2026-07-25

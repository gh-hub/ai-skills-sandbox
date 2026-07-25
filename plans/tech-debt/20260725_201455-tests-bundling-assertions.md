# tests-bundling-assertions

## Finding
(judgement call) Several tests (`auth.service.spec.ts`, `likes.spec.ts` attribution tests) bundle multiple assertions/behaviors into one test case (e.g. "hashes the password, creates the user, and issues a session token") rather than one assertion per test.

## Source
- Plan: plans/done/20260725_154735-user-accounts-auth/
- Round: round-1
- Category: Standards
- Logged: 2026-07-25
- Moved: 2026-07-25

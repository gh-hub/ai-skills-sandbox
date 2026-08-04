# session-cookie-util-placement

## Finding
(judgement call) `buildSessionCookieOptions()` in `auth.controller.ts` is a pure free function with no `this`/DI use, shared by both `signup` and `login` — candidate for extraction to a `session.util.ts` alongside the existing `session.constants.ts`.

## Source
- Plan: .gh-workflows/plans/done/20260725_154735-user-accounts-auth/
- Round: round-1
- Category: Standards
- Logged: 2026-07-25
- Moved: 2026-07-25

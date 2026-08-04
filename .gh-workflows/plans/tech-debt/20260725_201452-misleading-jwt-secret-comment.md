# misleading-jwt-secret-comment

## Finding
`jwt-secret.ts` carries a WHY-comment claiming it "mirrors the DATABASE_URL pattern in `../../db/client.ts`: read directly from process.env and hard-fail at startup if the secret is missing" — but `db/client.ts` does not hard-fail; it silently passes `undefined` to `Pool`. Misleading/inaccurate comment.

## Source
- Plan: .gh-workflows/plans/done/20260725_154735-user-accounts-auth/
- Round: round-1
- Category: Standards
- Logged: 2026-07-25
- Moved: 2026-07-25

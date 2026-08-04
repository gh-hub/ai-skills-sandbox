# jwt-secret-env-read-scattering

## Finding
`auth.controller.ts`'s `buildSessionCookieOptions()` reads `process.env.NODE_ENV` directly in controller/business code, a second uncentralized env-var read alongside `jwt-secret.ts`'s single-purpose module — scatters direct `process.env` access further instead of consolidating it.

## Source
- Plan: .gh-workflows/plans/done/20260725_154735-user-accounts-auth/
- Round: round-1
- Category: Standards
- Logged: 2026-07-25
- Moved: 2026-07-25

# signup-password-validation-message

## Finding
Backend signup DTO (`apps/api/src/apps/auth/dto/signup.dto.ts`) relies on `class-validator`'s default `@MinLength(6)` message rather than a custom, user-friendly message — the API itself (source of truth) doesn't carry the "clear validation message" the spec calls for; only the frontend's separate zod copy does.

## Source
- Plan: plans/done/20260725_154735-user-accounts-auth/
- Round: round-1
- Category: Spec
- Logged: 2026-07-25
- Moved: 2026-07-25

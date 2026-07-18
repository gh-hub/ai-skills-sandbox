# db-connection-token-unexercised

## Finding
`DbModule`/`DATABASE_CONNECTION` DI indirection is never exercised — `likes.spec.ts` still bootstraps tests via direct `import { pool } from "../db/client"`, so nothing overrides the token. Speculative Generality / Middle Man. (Standards)

## Source
- Plan: plans/done/20260718_163935-tech-debt-cleanup/
- Round: round-1
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-18

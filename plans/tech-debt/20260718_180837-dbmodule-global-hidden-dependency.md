# dbmodule-global-hidden-dependency

## Finding
`DbModule`'s `@Global()` registration is load-bearing for `LikesModule`, which never imports `DbModule` itself — a hidden cross-module dependency invisible from `LikesModule`'s own imports (Shotgun Surgery risk if `@Global()` is ever removed). (Standards)

## Source
- Plan: plans/done/20260718_163935-tech-debt-cleanup/
- Round: round-1
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-18

# 04 — apps/api: generate-openapi.ts error handling

**What to build:** A failure inside `generateOpenApiDocument()` surfaces as a clear logged error and non-zero process exit, instead of an unhandled promise rejection that's hard to diagnose in CI or locally.

**Blocked by:** None — can start immediately

**Status:** ready

- [ ] Body of `generateOpenApiDocument()` wrapped in try/catch
- [ ] On error: the error is logged and `process.exit(1)` is called
- [ ] Manually verified: temporarily breaking `NestFactory.create` (or simulating a write failure) produces a clear logged error and non-zero exit instead of an unhandled rejection
- [ ] Manually verified: the success path (`pnpm generate:openapi` with no induced failure) still works unchanged

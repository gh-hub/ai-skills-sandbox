# e2e-docker-probe-no-try-catch

## Finding
`isStackAlreadyRunning()` in `apps/e2e/playwright.config.ts` runs `execFileSync("docker", ["compose","ps",...])` with no try/catch; a raw child_process error surfaces if Docker isn't running, less helpful than `global-setup.ts`'s retry-with-context pattern for the same class of failure. (Standards)

## Source
- Plan: plans/done/20260718_192721-e2e-ui-testing/
- Round: round-2
- Category: Standards
- Logged: 2026-07-18
- Moved: 2026-07-19

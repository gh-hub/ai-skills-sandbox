# 02 — [spec] Remove leftover debug console-forwarding from home-header-scroll.spec.ts

**What to build:** `apps/e2e/tests/home-header-scroll.spec.ts` includes `page.on("console", (msg) => console.log("BROWSER:", msg.text()));` — debug instrumentation left over from investigation, not part of the spec's described test coverage. Remove it.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] The `page.on("console", ...)` line is removed from `home-header-scroll.spec.ts`
- [x] Full e2e suite still green after the change. 59/59 passed (see verification below).

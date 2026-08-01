# Notes: review-round-1 fix 02 — role delete status code

## What was built
- `apps/api/src/apps/roles/roles.service.ts`: `remove()` now throws `BadRequestException` (400) instead of `ConflictException` (409) when the target role is built-in (`role.isBuiltIn`). The in-use-without-force branch for custom roles is untouched and still throws `ConflictException` (409) with the `{ message, users }` body.
- `apps/api/src/apps/roles/roles.spec.ts`: updated all three built-in-deletion-rejection tests under `DELETE /roles/:id` to `.expect(400)`:
  - "rejects deleting the ADMIN built-in role"
  - "rejects deleting the ADMIN built-in role even with force"
  - "rejects deleting the OPERATOR built-in role"

  Note: the ticket and CONTEXT.md both said "two" built-in-deletion tests, but the file actually has three (ADMIN, ADMIN+force, OPERATOR). All three needed the same fix since they all exercise the same `role.isBuiltIn` branch in the service. Updated all three; ticket checkboxes note this discrepancy.
- Left the `POST /roles` duplicate-name-conflict tests (409, for both custom-name collision and re-creating ADMIN/OPERATOR by name) unchanged — those are a genuinely different code path (`create()`'s `ConflictException` for an existing name) and are out of scope for this ticket, which is about `DELETE`/`remove()` only.
- No frontend change needed: `apps/web/lib/api-client/roles.ts`'s `useDeleteRole()` only special-cases `response.status === 409` to surface the in-use-conflict shape; any other non-2xx status (now including 400 for built-in) falls through to the generic `throwApiError` path. The UI never offers a delete control for built-in roles in the first place (per spec: "present only for custom (non-built-in) roles, fully absent... for ADMIN/OPERATOR"), so this code path is unreachable from the UI regardless — confirmed unaffected, no edit made.

## Verification
- `npx tsc --noEmit` in `apps/api`: clean.
- `npx jest src/apps/roles/roles.spec.ts --runInBand`: 19/19 pass.
- Full `npx jest --runInBand` in `apps/api`: 13 suites / 185 tests, all pass — confirms no other spec depended on the old 409 behavior for built-in-role deletion.

## What the next session needs to know
- Next ticket: `review/round-1/tickets/03-remove-scope-creep-test-artifacts.md` — removing the leftover `apps/e2e/tests/repro.spec.ts` debug file and stray `console.log` in `apps/api/src/apps/users/users.spec.ts` (and any unrelated gh-dev-workflow skill-file edits that crept into this branch's diff). See `review/round-1/findings.md` for the exact scope-creep items flagged.
- This ticket was backend-only, no live e2e run performed (not applicable — no e2e coverage change). The broader "one full live e2e run once tickets 02-06 are all done" recommendation from earlier notes still stands and should happen once ticket 03 (and any remaining fix tickets) are done.
- Docker was healthy and available this session (`docker info` succeeded, testcontainers-based `roles.spec.ts` ran fine) — no stability issues encountered.

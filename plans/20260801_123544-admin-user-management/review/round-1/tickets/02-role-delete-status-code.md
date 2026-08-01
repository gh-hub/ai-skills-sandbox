# 02 — [spec] Fix built-in role deletion to return 400, not 409

**What to build:** `RolesService.remove()` must throw `BadRequestException` (400), not `ConflictException` (409), when the target role is built-in (`role.isBuiltIn`), matching spec.md's API contract table ("400 if built-in"). Update `roles.spec.ts`'s existing assertions (which currently wrongly assert `.expect(409)` for the ADMIN/OPERATOR built-in-deletion-rejection tests) to expect 400.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] Deleting a built-in role (ADMIN or OPERATOR) returns 400, regardless of `force`
- [x] `roles.spec.ts` asserts 400 (not 409) for both built-in-role-deletion tests (note: there are actually three such tests in the file — ADMIN without force, ADMIN with force, and OPERATOR — all three updated to `.expect(400)`, not just two)
- [x] The in-use-without-force conflict response for a *custom* role remains 409 (unchanged) — verified via the existing "blocks deleting a custom role currently held by users..." test, untouched and still passing

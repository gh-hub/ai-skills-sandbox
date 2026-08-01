# 05 — Award edit flow

**What to build:** An `ADMIN`/`OPERATOR` user can edit an existing award, end to end — from clicking a per-row edit icon through a pre-filled, double-confirmed modal to the award actually updating in the list.

**Blocked by:** 04 — Frontend gating foundation

**Status:** ready

- [ ] A new update mutation hook calls `PATCH /awards/:id` with a partial body (title/description/icon) and invalidates the awards list query on success, mirroring the shape of the existing create-award mutation hook.
- [ ] An edit icon appears on every award row, gated by the same "can manage awards" condition used elsewhere — invisible to logged-out visitors and to logged-in users without `ADMIN`/`OPERATOR`.
- [ ] Clicking the edit icon opens a modal pre-filled with that award's current title, description, and icon.
- [ ] The edit modal's fields and validation match the create form's: title required, description required, icon optional.
- [ ] Submitting the (validated) edit form does not immediately call the update mutation — it transitions the modal into a second, explicit "are you sure you want to save these changes?" confirmation step. Only confirming that second step actually triggers the `PATCH` call.
- [ ] Canceling either the edit form itself or the confirmation step closes the modal with no request sent — starting an edit never commits the user to finishing it.
- [ ] On a successful update, the modal closes and the awards list re-renders from the invalidated query (no manual state patching), matching the existing create-flow's invalidate-and-refetch pattern.
- [ ] E2e coverage confirms the double-confirmation requirement: the `PATCH` request does not fire after the first form submit, only after the second confirmation step is accepted.

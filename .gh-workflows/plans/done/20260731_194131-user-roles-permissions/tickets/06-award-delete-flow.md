# 06 — Award delete flow

**What to build:** An `ADMIN`/`OPERATOR` user can delete an existing award, end to end — from clicking a per-row delete icon through a confirmation modal to the award disappearing from the list.

**Blocked by:** 04 — Frontend gating foundation

**Status:** ready

- [ ] A new delete mutation hook calls `DELETE /awards/:id` and invalidates the awards list query on success.
- [ ] A delete icon appears on every award row, gated by the same "can manage awards" condition used elsewhere — invisible to logged-out visitors and to logged-in users without `ADMIN`/`OPERATOR`.
- [ ] Clicking the delete icon opens a confirmation modal showing the award's title and a single confirm/cancel choice ("are you sure you want to delete this award?") — nothing happens before this modal is shown.
- [ ] Confirming the modal calls the delete mutation; on success the modal closes and the award disappears from the list via the invalidated query re-render, with no page reload and no manual state patching.
- [ ] Canceling the confirmation modal closes it with no request sent — opening it by mistake is harmless.
- [ ] E2e coverage confirms the confirmation requirement: the `DELETE` request does not fire until the confirmation modal is explicitly accepted.

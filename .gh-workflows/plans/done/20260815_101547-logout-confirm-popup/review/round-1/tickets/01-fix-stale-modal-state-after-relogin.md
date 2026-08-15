# 01 — [spec] Fix stale confirm-dialog state reopening after re-login

**What's wrong:** `apps/web/components/header-auth-control.tsx` holds `isLogoutModalOpen` in `useState`. `HeaderAuthControl` never unmounts across a logout/login cycle — it's one component instance that conditionally renders either its anonymous-view or authenticated-view subtree depending on `me.data`. When logout succeeds, `me.data` becomes `null` and the authenticated branch (including the mounted `LogoutConfirmModal`) stops rendering, so the dialog visually disappears — but `isLogoutModalOpen` itself is never reset to `false`. If the user then logs back in within the same session (no full page reload), `HeaderAuthControl` re-renders into its authenticated branch again and remounts `<LogoutConfirmModal open={isLogoutModalOpen} ...>` with the stale `true` value, so the confirm-logout dialog spuriously reopens right after login. Radix's Dialog marks the rest of the page `aria-hidden` while open, so the "Log out" button becomes inaccessible until the user dismisses a dialog they never triggered.

This contradicts the spec's own (incorrect) assumption: "On success: no explicit close needed — `HeaderAuthControl` already unmounts this view once `me.data` becomes `null`." The component itself doesn't unmount — only its returned subtree changes — so that assumption doesn't hold and an explicit reset is required.

**Reproduced by:** `apps/e2e/tests/auth-flow.spec.ts` — `"logging in with an existing account, then logging out, restores the Login button"` (fails consistently, not flaky — reran in isolation twice, identical failure both times, at the final `expect(... "Log out" ...).toBeVisible()` assertion after re-login).

**Blocked by:** None

**Status:** ready

- [x] `isLogoutModalOpen` is reset to `false` on a successful logout, so a subsequent login in the same session never remounts the confirm dialog already open. Prefer resetting it as part of the logout success path (e.g. an `onSuccess` callback wired into the `logout.mutate()` call that also does `setIsLogoutModalOpen(false)`, or an effect that closes the modal once `me.data` becomes `null`) rather than relying on unmount — pick whichever fits this component's existing structure most naturally, keeping the modal's own on-failure inline-error behavior (`logout.isError`) intact.
- [x] Correct `spec.md`'s "On success: no explicit close needed" line to reflect the actual fix (either in the ticket write-up or as a follow-up note — whichever this repo's convention for a corrected spec assumption is; see ticket 01's own "Correction from spec" pattern for precedent).
- [x] `apps/e2e/tests/auth-flow.spec.ts`'s `"logging in with an existing account, then logging out, restores the Login button"` test passes again, and passes on a rerun (not just once).
- [x] No regression in the existing passing behavior: Cancel still dismisses with no mutation call; "Yes, log out" still performs the mutation and shows the inline error on failure; both buttons still disabled while pending.

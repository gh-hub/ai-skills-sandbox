# 01 — Add logout confirmation dialog

**What to build:** Clicking "Log out" opens a confirm dialog instead of immediately logging out. "Cancel" dismisses the dialog with no effect (still logged in). "Yes, log out" performs the actual logout (existing `useLogout()` flow via `logout.mutate()`), with an inline error message on failure and both buttons disabled while the mutation is pending.

**Blocked by:** None — can start immediately

**Status:** ready

- [x] New component `apps/web/components/logout-confirm-modal.tsx` exists, using the shadcn `Dialog` primitive (mirrors `delete-role-modal.tsx`'s structure: controlled `open`/`onOpenChange`, `DialogHeader`/`DialogTitle`, `DialogFooter` with two buttons)
- [x] Dialog title is "Log out?", body text is "Are you sure you want to log out?"
- [x] "Cancel" button (outline variant) closes the dialog without calling `logout.mutate()`
- [x] "Yes, log out" button (default variant, not destructive) calls `logout.mutate()`
- [x] Both buttons are disabled while `logout.isPending` is true
- [x] On mutation failure, an inline error message "Couldn't log out. Please try again." is shown (mirrors `delete-role-modal.tsx`'s `showGenericError` pattern)
- [x] `apps/web/components/header-auth-control.tsx`'s "Log out" button now opens the new modal instead of calling `logout.mutate()` directly
- [x] On successful logout, no explicit modal-close call is needed (verified: `useLogout`'s `onSuccess` sets the `me` query data to `null`, which flips `HeaderAuthControl` to its `me.data === null` branch returning `<AuthModal />` — this replaces the whole subtree, including `LogoutConfirmModal`, so it unmounts automatically)
- [x] **Correction from spec (discovered during implement):** `apps/web` has no component/unit test framework at all (no jest/vitest config, no `.test.tsx` files anywhere in the app) — the real test seam for frontend behavior in this repo is Playwright e2e, in `apps/e2e`. Add a `logout(page)` helper to `apps/e2e/tests/helpers.ts` that clicks "Log out" then confirms "Yes, log out" in the new dialog, and use it in place of the bare `.getByRole("button", { name: "Log out" }).click()` calls in `apps/e2e/tests/auth-flow.spec.ts` (currently at the "logging in with an existing account, then logging out" test, the "wrong password" test, and the "already-registered email" test — all three click "Log out" and immediately proceed as if already logged out, which breaks once the confirm dialog is in place)
- [x] New e2e test in `apps/e2e/tests/auth-flow.spec.ts` covers the confirm dialog itself: clicking "Log out" shows the dialog with the expected copy; clicking "Cancel" dismisses it and the user is still logged in (Log out button still visible, no Login button); clicking "Yes, log out" logs out as before

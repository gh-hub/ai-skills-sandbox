# Requirements: logout-confirm-popup

## Problem

Clicking "Log out" in the header immediately signs the user out with no confirmation. An accidental click results in losing the session with no recovery step, creating a poor UX for users who may have clicked the button unintentionally.

## Solution

Add a confirmation dialog to the logout flow:
- New component: `apps/web/components/logout-confirm-modal.tsx`
- Dialog title: "Log out?"
- Dialog body: "Are you sure you want to log out?"
- Two buttons:
  - "Cancel" (outline variant)
  - "Yes, log out" (default variant — not destructive, since logout is not a destructive data operation)
- Both buttons disabled while the logout mutation is pending
- On failure: show inline error message "Couldn't log out. Please try again." (same pattern as delete-role-modal.tsx)
- On success: modal closes automatically when the authenticated view unmounts (no explicit close call needed)

## Technical approach

1. Create `logout-confirm-modal.tsx` mirroring the structure of `delete-role-modal.tsx`:
   - Use shadcn `Dialog` primitive from `components/ui/dialog.tsx`
   - Controlled `open` state with `onOpenChange` callback
   - Render generic error message conditionally on `logout.isError`
   - Disable both buttons while `logout.isPending`

2. Update `apps/web/components/header-auth-control.tsx`:
   - Replace the current "Log out" button (lines 43–50) that calls `logout.mutate()` directly
   - Instead, add modal state and open the modal when the button is clicked
   - Move the `logout.mutate()` call to the modal's confirm button

3. Modal closes automatically on success because `HeaderAuthControl` detects when `me.data === null` (after logout succeeds) and unmounts the authenticated view, rendering `<AuthModal />` instead

## Done looks like

- `logout-confirm-modal.tsx` exists with Dialog, error handling, and pending states
- "Log out" button in `header-auth-control.tsx` opens the modal instead of immediately logging out
- Confirm button in the modal calls `logout.mutate()`
- Dialog closes automatically on success; on failure, error message displays and user can retry
- No manual modal close required — unmounting is automatic once logout succeeds
- Both buttons properly disabled during pending state

## Out of scope

- No redirect changes after logout
- No changes to the `/auth/logout` backend endpoint
- No new `AlertDialog` primitive installation (reuse `Dialog`)

## Environment notes

- Logout trigger lives in `apps/web/components/header-auth-control.tsx`, calling `useLogout()` from `apps/web/lib/api-client/auth.ts` (lines ~89–104)
- `useLogout()` POSTs to `/auth/logout` and on success calls `queryClient.setQueryData(meQueryKey, null)` + invalidates `meQueryKey`
- No client-side redirect happens on logout
- `HeaderAuthControl` already unmounts the authenticated view when `me.data === null`, rendering `<AuthModal />` instead
- Confirmed via grep that `header-auth-control.tsx` is the ONLY logout entry point in the app — no mobile nav or duplicate logout trigger exists
- `components/ui/alert-dialog.tsx` does NOT exist; `components/ui/dialog.tsx` exists (shadcn Dialog wrapper exporting `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`)
- Dialog is already used for confirmations elsewhere: `delete-role-modal.tsx` (closest structural match), `delete-award-modal.tsx`, `edit-award-modal.tsx`, `auth-modal.tsx`
- Decision: Dialog (not AlertDialog, which isn't installed) + default button variant (not destructive, since logout is not data-destroying like role deletion)

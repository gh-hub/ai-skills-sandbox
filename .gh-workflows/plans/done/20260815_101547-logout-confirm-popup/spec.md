## Problem Statement

Clicking "Log out" in the header immediately signs the user out with no confirmation. An accidental click loses the session with no recovery step.

## Solution

A confirmation dialog appears when "Log out" is clicked, asking the user to confirm before actually logging out. Canceling leaves the user logged in with no side effects; confirming proceeds with the existing logout flow.

## Implementation Decisions

- New component `apps/web/components/logout-confirm-modal.tsx`, structured like the existing `delete-role-modal.tsx` (shadcn `Dialog` primitive — `AlertDialog` isn't installed in this repo).
- Copy: title "Log out?", body "Are you sure you want to log out?", buttons "Cancel" (outline) and "Yes, log out" (default variant, not destructive).
- `header-auth-control.tsx`'s "Log out" button opens the modal instead of calling `logout.mutate()` directly; the modal's confirm button performs the actual mutation.
- Both buttons disabled while `logout.isPending`.
- On failure: inline error "Couldn't log out. Please try again." (same pattern as `delete-role-modal.tsx`'s `showGenericError`).
- On success: `HeaderAuthControl` never unmounts across a logout/login cycle (it's one instance conditionally rendering an anonymous- or authenticated-view subtree based on `me.data`), so `isLogoutModalOpen` must be explicitly reset. The "Yes, log out" click passes a per-call `onSuccess` option to `logout.mutate()` that calls `onOpenChange(false)`, closing the modal on success without touching the on-failure inline-error path.

## Testing Decisions

- Component/integration test on `logout-confirm-modal.tsx` (or `header-auth-control.tsx`) verifying: clicking "Log out" opens the dialog without calling logout; "Cancel" closes it with no mutation call; "Yes, log out" triggers `logout.mutate()`; buttons are disabled while pending.
- Prior art: no existing test file found for `delete-role-modal.tsx` or `header-auth-control.tsx` in this repo — this will be the first test seam of this kind for these components, so keep it lightweight (React Testing Library render + click, per whatever test setup already exists in `apps/web`, if any).

## Out of Scope

- No redirect changes after logout.
- No changes to the `/auth/logout` backend endpoint.
- No new `AlertDialog` primitive.

## Further Notes

- None open — grill covered everything needed.

## Problem Statement

On the "Thanks, Claude" homepage, users share their story via a button that inline-expands a form directly below it, with the button label toggling between "Share a story" and "Hide story" while open. This is inconsistent with the app's existing modal pattern (used for logout confirmation).

## Solution

Convert the inline expand/collapse into a popup: clicking "Share a story" opens a Dialog modal (mirroring `logout-confirm-modal.tsx`) containing the same story form. The button becomes static and never changes label. The modal has Cancel and Submit actions, closes and resets on successful submit, and resets on Cancel too.

## Implementation Decisions

- New component `apps/web/components/share-story-modal.tsx`, modeled directly on `logout-confirm-modal.tsx`. `page.tsx` keeps owning the form state (`useForm`, `handleStorySubmit`, `storySubmit`) and passes it down as props — same pattern as `header-auth-control.tsx` owning `logout` and passing it into `LogoutConfirmModal`.
- `page.tsx`: replace `isExpanded` with `isStoryModalOpen`; button label becomes static "Share a story"; the inline conditional `<Form>` block moves into `<ShareStoryModal>`; `onSuccess` now closes the modal instead of collapsing the section.
- New modal: `DialogTitle` "Share a story", the form fields/error banner moved verbatim, `DialogFooter` with Cancel (resets form, closes modal, disabled while pending) and Submit (existing behavior, disabled while pending).
- No changes to `useSubmitLike`, `AwardCheckboxList`, `StatsBand`, `StoryFeed`, the like section, or the logout modal.

## Testing Decisions

- Test at whatever seam existing e2e/UI tests use for this page today (check for prior art first).
- Assert observable behavior: opening the modal, submit closing+resetting it, cancel closing+resetting it, button label staying static.

## Out of Scope

- API/validation/award-list changes, logout modal changes, changes to like/stats/feed sections.

## Further Notes

- None — grill resolved all ambiguity.

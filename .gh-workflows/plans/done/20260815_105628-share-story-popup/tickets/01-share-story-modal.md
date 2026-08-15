# 01 — Convert "Share a story" into a modal popup

**What to build:** Clicking the "Share a story" button on the homepage (`apps/web/app/page.tsx`) opens a Dialog-based modal (new component `apps/web/components/share-story-modal.tsx`, modeled on `apps/web/components/logout-confirm-modal.tsx`) instead of expanding an inline form section. The modal contains the existing story form (story textarea, hours-saved input, awards checkboxes via `AwardCheckboxList`) and the existing submit-error banner, unchanged in logic — `page.tsx` still owns the `useForm` instance, `handleStorySubmit`, and the `storySubmit` mutation, passing them down as props to the modal (same pattern `header-auth-control.tsx` uses for `logout`/`LogoutConfirmModal`). The button label is static ("Share a story") and never flips to "Hide story". The modal's `DialogTitle` reads "Share a story". Its `DialogFooter` has a Cancel button (resets the form and closes the modal, disabled while `storySubmit.isPending`) and a Submit button (existing submit behavior, disabled while `storySubmit.isPending`). On successful submission, the form resets and the modal closes automatically (replacing today's `setIsExpanded(false)` with closing the modal).

**Blocked by:** None — can start immediately

**Status:** done

- [x] Clicking "Share a story" opens a modal dialog instead of expanding inline content
- [x] Modal displays title "Share a story", the story/hoursSaved/awards form fields, and the existing error banner when submission fails
- [x] Modal footer has Cancel and Submit buttons
- [x] Cancel closes the modal and resets the form
- [x] Successful submit resets the form and closes the modal
- [x] The "Share a story" button label never changes (no more "Hide story" state)
- [x] Existing form validation, mutation logic, and other page sections (like button, stats, story feed) are unaffected

**Verification:** `npx tsc --noEmit` clean; `npm run build` (includes lint + type check) passed; full e2e suite (`share-story-modal.spec.ts` + `story-form-flow`, `story-award-picker`, `story-feed`, `stats-band`, `auth-flow`, `like-flow`, `smoke` specs) — 22/22 passed. One e2e test (`share-story-modal.spec.ts`) was authored with an assertion that checked the trigger button's role-visibility *while its own modal was still open*; Radix's `Dialog` applies `aria-hidden` to background content while open (same reason `auth-flow.spec.ts` never asserts the "Log out" trigger's visibility while its confirm dialog is open), so this was a test bug, not an implementation bug — fixed by moving that assertion to after closing the modal via Cancel, matching the established pattern.

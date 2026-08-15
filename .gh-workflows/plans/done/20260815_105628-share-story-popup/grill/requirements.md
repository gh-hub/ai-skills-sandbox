# Requirements: Share-a-story popup

## Problem

On the "Thanks, Claude" homepage (`apps/web/app/page.tsx`), the "Share a story" button currently toggles an inline form open/closed directly below it on the same page — clicking it expands a form section, and the button's own label flips to "Hide story" while expanded. This inline expand/collapse behavior should be replaced with a popup (modal dialog) instead, following the same overlay pattern the app already uses for the logout confirmation (`apps/web/components/logout-confirm-modal.tsx`).

## Solution

- The "Share a story" button becomes static — it always reads "Share a story" and, on click, opens a Dialog-based modal. There is no more inline expand/collapse and no button text flip.
- A new modal component mirrors the structure of `logout-confirm-modal.tsx`: `Dialog` / `DialogContent` / `DialogHeader` / `DialogTitle` / `DialogFooter` (from `@/components/ui/dialog`).
- The modal hosts the existing story-submission "work": the react-hook-form + zod form (`story` textarea, `hoursSaved` input, `awardIds` via `AwardCheckboxList`), and the existing inline error banner ("Couldn't submit your story. Please try again.") shown when `storySubmit.isError`. This form logic (schema, `useForm`, `handleStorySubmit`, the `storySubmit` mutation from `useSubmitLike`) is unchanged — only its presentation moves from an inline expanding section into the modal's body.
- Modal title (`DialogTitle`): "Share a story"
- `DialogFooter` has two buttons:
  - **Cancel** — closes the modal and resets the form (discards any entered input), disabled while `storySubmit.isPending` (matching how `logout-confirm-modal.tsx` disables Cancel while `logout.isPending`)
  - **Submit** — the existing submit button, disabled while `storySubmit.isPending`
- On successful submission: the form resets and the modal closes automatically (same as today's `onSuccess` handler — currently `form.reset()` + `setIsExpanded(false)`, becoming `form.reset()` + closing the modal).
- The like button/count section, `StatsBand`, and `StoryFeed` sections elsewhere on the page are unaffected.

## Done looks like

- Clicking "Share a story" opens a modal dialog (not an inline expanding section).
- The modal contains the story form (story, hours saved, awards) exactly as it exists today, functionally unchanged.
- Modal has a title "Share a story", a Cancel button, and a Submit button.
- Successful submission closes the modal and resets the form.
- Cancel closes the modal and resets the form.
- The button no longer changes its label based on open/closed state.

## Out of scope

- Any change to the story submission API contract, validation rules, or the `useSubmitLike`/`AwardCheckboxList` implementations.
- Any change to the like button, stats band, or story feed sections.
- Any change to the logout modal itself (it's a reference pattern only).

## Environment notes

- Current implementation lives in `apps/web/app/page.tsx` (the `Home` component), specifically the `isExpanded` state, the "Share a story"/"Hide story" toggle button, and the conditionally-rendered `<Form>` block (roughly lines 92–283 as of this writing).
- Reference modal pattern: `apps/web/components/logout-confirm-modal.tsx`, used by `apps/web/components/header-auth-control.tsx` (manages its own `isLogoutModalOpen` state, passes `open`/`onOpenChange` props to the modal).
- Dialog primitives come from `@/components/ui/dialog` (`Dialog`, `DialogContent`, `DialogFooter`, `DialogHeader`, `DialogTitle`) — shadcn/ui style, already used by the logout modal.
- The form itself uses `@hookform/resolvers/zod`, `react-hook-form`, and shadcn `Form`/`FormField`/`FormItem`/`FormLabel`/`FormControl`/`FormMessage` components, plus `AwardCheckboxList`, `Input`, `Textarea` — all already imported in `page.tsx` today.

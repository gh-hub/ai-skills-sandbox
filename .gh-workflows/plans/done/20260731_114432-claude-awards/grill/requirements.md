# Requirements: claude-awards

## Problem / Goal

Right now, people can say thanks to Claude Code with a quick "Like" or by sharing a
story (with an optional hours-saved number). There's no way to call out *what kind*
of help they got. We want to let people attach one or more specific "awards" (e.g.
🐛 Bug Slayer, ⚡ Speed Demon) when they share a thanks story — and let anyone browse
the full list of awards along with how many times each one has been given out.

## Actors

- **Any site visitor (anonymous or logged in)** can:
  - View the list of awards and how many times each has been given.
  - Give thanks (one-click like, or the story form).
  - Attach one or more awards to a thanks story they're sharing.
- **Logged-in users only** can:
  - Create a brand-new award (title, description, optional icon).
- There is no admin or role concept in this system, and none is being introduced.
  Only the "must be logged in" distinction applies, and only for creating new awards.

## What "done" looks like

- A user filling out the "Share a story" form can optionally select any number of
  existing awards (via checkboxes showing icon + title) before submitting. Selecting
  awards is entirely optional — a story can have zero, one, or many awards attached,
  same as the story text and hours-saved fields already are.
- The quick one-click "Like" button keeps working exactly as it does today — no
  award picker is added to that flow.
- The story feed shows a badge (icon + title) for every award attached to a given
  thanks entry, alongside the existing story content.
- A new `/awards` page lists all awards (starting with 7 pre-seeded ones), each
  showing its icon, title, description, and a live count of how many thanks stories
  it's been attached to.
- On that same `/awards` page, logged-in users see a form to create a new award
  (title, description, optional icon) and it becomes immediately selectable on the
  story form afterward.
- Anonymous visitors on the `/awards` page see a prompt (e.g. "log in to create an
  award") that opens the site's existing login/signup modal, instead of seeing the
  create form.
- The 7 initial awards (Bug Slayer, Speed Demon, Clean Code, Lifesaver, Creative
  Genius, Patient Teacher, Refactor Royalty) exist immediately after deploy, with no
  manual setup step required.

## Boundaries / Out of scope

- No edit or delete UI. The backend supports updating and deleting an award, but no
  screen in the app wires those actions up yet.
- No admin or role system. It doesn't exist today and this feature does not
  introduce one.
- No login requirement anywhere except creating a new award. Viewing awards, giving
  thanks, and attaching existing awards to a thanks story all remain open to
  anonymous visitors.
- No changes to the one-click "Like" button flow — it stays exactly as it is today.

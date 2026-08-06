# Requirements: thanks-claude

## Problem
The user wants a small, basic monorepo to test a skill-based dev workflow end-to-end, built around a real (if tiny) product: a page where people can say "thank you" to Claude.

## Solution
A page with a "like" button. Clicking it records a thank-you. Optionally, the visitor can open a box and write a short story about what they loved / how Claude helped them, plus how many hours it saved them. The page shows a running total of likes.

## Actors
- **Visitor** — anonymous, no login. Clicks like, optionally adds a story + hours saved.

## Done looks like
- Visiting the static frontend shows a like button and the current total like count.
- Clicking like increments the total (a new row is always created — repeat likes from the same person are allowed and expected, this is a feature not a bug).
- An optional expandable box lets the visitor add free-text "story" and a number of hours saved before/while liking.
- Data is persisted in a local Postgres database via Docker Compose.
- The NestJS API exposes documented (Swagger) endpoints with validated (class-validator) request bodies.
- The Next.js frontend is a fully static export, served by nginx, which reverse-proxies API calls so the browser only talks to one origin.
- Shared TypeScript types (e.g. the like/testimonial shape) live in a `packages/` workspace used by both apps.

## Out of scope (this plan)
- Authentication / user accounts
- Admin dashboard or any public listing/wall of submitted stories
- Duplicate-like prevention of any kind (client or server)
- CI/CD pipeline
- Cloud deployment config — local Docker Compose only

# Glossary

- **The box / terminal-style hero box**: The new bordered, `font-mono`, CSS-built container at the top of `apps/web/app/page.tsx` that replaces the old icon/heading/subtitle hero, styled to look like the Claude Code CLI's splash screen.
- **Title bar**: The top area of the box containing the box's title text ("Thanks, Claude (code)"), analogous to the CLI mockup's `╭─── Claude Code v2.1.220 ───╮` line; this text is the page's actual `<h1>`.
- **Left column**: The box's left-hand content area — greeting, logo, live stats line, and tagline.
- **Right column**: The box's right-hand content area — tips, divider, "what's new" blurb, and closing link to the story feed.
- **Stats line**: The left column's live-data line ("{likes} likes · {hours}h saved so far"), sourced from the existing `useLikesStats()` hook, mapped from the CLI mockup's model/team/org info line.
- **Feature app**: In `apps/api`, a NestJS module owning one product feature, organized under `src/apps/{feature}/` (e.g. `src/apps/likes/`), as opposed to root-level bootstrap/shared infrastructure files.
- **Repository layer**: In this project's context, the file (`{feature}.repository.ts`) that is the only place allowed to touch the DB client/schema/raw Drizzle queries for a feature; it returns raw rows and contains no business logic.
- **Service layer**: The file (`{feature}.service.ts`) that owns all business logic for a feature (data shaping, computed values, calling utils), calling the repository for data and being called by the controller.
- **Thin controller**: A controller that contains only HTTP/routing concerns (decorators, DTOs in/out, delegating to the service) — no direct DB access and no business logic.
- **Root bootstrap files**: `apps/api/src/main.ts`, `app.module.ts`, `app.controller.ts`, `db/` (client.ts, db.module.ts, schema.ts), and `generate-openapi.ts` — shared NestJS app infrastructure that is not a feature app and stays at `src/` root.

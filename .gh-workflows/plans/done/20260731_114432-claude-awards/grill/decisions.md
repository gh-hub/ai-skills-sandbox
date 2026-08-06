# Decisions: claude-awards

## Decision: Add an optional `icon` field to the awards table
Decided: The `awards` table has `title` (required text), `description` (required
text), and `icon` (optional text — a short string/emoji).
Why: Awards are meant to be visually recognizable (e.g. 🐛 Bug Slayer) in badges and
listings, but not every award needs a custom icon to be created.
Alternatives rejected: Making `icon` required — rejected because it would block
quick award creation and isn't needed for the award to make sense.

## Decision: Icon is optional with a UI-level default fallback
Decided: When `icon` is blank, the UI renders a default icon (e.g. 🎖️) instead of
leaving a blank space. This fallback is a frontend rendering concern, not a backend
default value.
Why: Keeps the create-award form simple (icon isn't a mandatory input) while still
guaranteeing every award looks complete wherever it's displayed.
Alternatives rejected: Backend-side default value stored in the DB — rejected in
favor of keeping the stored value nullable/absent and letting the UI decide the
fallback presentation.

## Decision: Full REST CRUD on the backend even though the UI only exposes list + create
Decided: `apps/api/src/apps/awards/` implements `GET /awards`, `GET /awards/:id`,
`POST /awards`, `PATCH /awards/:id`, and `DELETE /awards/:id`, mirroring the full
`likes` module structure (controller/service/repository/dto/tests). The frontend
only wires up listing and creating for now.
Why: Following the existing `likes` module as the reference architecture means
building the complete resource shape up front; update/delete are cheap to add
alongside list/create and avoid a later rework of the module/DTO layer.
Alternatives rejected: Building only list + create endpoints to match current UI
scope — rejected since the fuller CRUD surface is low-cost to add now and keeps the
module consistent with the established convention.

## Decision: Final list of 7 seeded awards
Decided: The initial award set is exactly: 🐛 Bug Slayer, ⚡ Speed Demon, 🧠 Clean
Code, 🛟 Lifesaver, 🎨 Creative Genius, 📚 Patient Teacher, 🔧 Refactor Royalty (see
requirements.md for full descriptions).
Why: Gives the feature a complete, usable set of awards on day one without waiting
for users to create their own.
Alternatives rejected: Launching with zero awards and relying entirely on
user-created ones — rejected because it would make the story form's award picker
empty at launch.

## Decision: Pre-seed the 7 awards via a Drizzle migration
Decided: The seed data is inserted as part of a Drizzle migration (not a manual
script or admin action), so the awards exist immediately after deploy.
Why: Matches how schema changes are already delivered in this repo (numbered SQL
migration files) and guarantees the feature works out of the box in every
environment without a manual setup step.
Alternatives rejected: A separate seed script run manually post-deploy — rejected
as an extra manual step that could be forgotten.

## Decision: A single thanks submission can have multiple attached awards
Decided: The relationship between a thanks story (`likes` row) and awards is
many-to-many via a new join table — zero, one, or many awards per submission.
Why: Real thanks stories often reflect more than one kind of help (e.g. both fast
*and* clean code), so limiting to a single award per story would be artificially
restrictive.
Alternatives rejected: A single nullable `awardId` column directly on `likes` —
rejected because it can't represent more than one award per story.

## Decision: Award picker only appears on the "Share a story" form, not the quick Like button
Decided: The one-click "Like" button flow (`likeSubmit.mutate({})`) is unchanged;
only the expandable story form gains the award multi-select.
Why: The quick Like button is intentionally frictionless (no fields at all); adding
an award picker there would contradict its purpose. The story form is already the
place for adding optional detail (story text, hours saved).
Alternatives rejected: Adding award selection to both flows — rejected to preserve
the one-click button's simplicity.

## Decision: Award selection on the story form is fully optional
Decided: A story submission can be sent with zero, one, or many awards selected;
nothing forces a minimum selection.
Why: Consistent with `story` and `hoursSaved` already being optional fields on the
same form — awards follow the same "share as much or as little as you want"
philosophy.
Alternatives rejected: Requiring at least one award when the story form is used —
rejected as an unnecessary new constraint not requested and inconsistent with the
rest of the form.

## Decision: Single combined `/awards` page for both browsing/counts and creation
Decided: One new page shows the full award list with give-counts and (for logged-in
users) the create-award form, rather than splitting browsing and management into
separate pages/routes.
Why: Awards are a small, low-complexity resource (no edit/delete UI yet); a single
page keeps navigation simple and avoids over-building routing structure this stage
doesn't need.
Alternatives rejected: A separate admin-style management page for creation, distinct
from a public browsing page — rejected as unnecessary complexity given there's no
role system and the create form itself is already gated by a login check inline.

## Decision: `POST /awards` requires login; `GET`, `PATCH`, `DELETE` stay open
Decided: Creating a new award requires the user to be logged in (via the existing
auth mechanism in `apps/api/src/apps/auth/`, exact guard TBD at implementation
time). Listing, fetching, updating, and deleting awards remain unauthenticated,
matching how `likes` endpoints work today.
Why: Explicit requirement from the interview — only award *creation* needs a
logged-in identity attached; nothing else in the awards or likes feature requires
login today, and no role/permission system exists to gate PATCH/DELETE further.
Alternatives rejected: Requiring login for PATCH/DELETE too (to prevent anonymous
tampering) — explicitly rejected for this phase since there's no UI for those
actions yet and no admin concept to base such a restriction on; revisit later if
those endpoints get UI exposure.

## Decision: Anonymous visitors on `/awards` see a login prompt instead of the create form
Decided: When not logged in, the `/awards` page shows a "log in to create an award"
prompt/button that opens the existing reusable login/signup modal (from commit
6cc3e34), rather than showing a disabled or hidden form.
Why: Reuses an existing, working UI pattern (the header's login modal) rather than
building a new auth prompt; keeps the login path consistent across the app.
Alternatives rejected: Simply hiding the create form entirely with no call to
action — rejected as a worse experience that doesn't guide anonymous users toward
logging in.

## Decision: Deleting an award cascades to remove its attachments, not the thanks story
Decided: Deleting an award removes any join-table rows referencing it (so it
disappears from any thanks story it was attached to), but the underlying `likes`
(thanks) record is left completely untouched.
Why: An award being deleted shouldn't destroy someone's thanks story or its
content — the story stands on its own; only the now-invalid award reference needs
cleanup.
Alternatives rejected: Blocking deletion of an award while it's still attached to
any story — rejected as unnecessarily restrictive and not requested; cascading the
join row is simpler and sufficient.

# Glossary: claude-awards

**Award** — A badge or recognition type someone can attach to a thanks story, made
up of a title, a description, and an optional icon (short string/emoji). Example:
🐛 "Bug Slayer" — "Squashed a nasty bug that had been haunting the codebase." Awards
are shared, reusable entities — many different thanks stories can carry the same
award, and one story can carry several different awards.

**Thanks vs. Like** — "Thanks" is the user-facing name for the feature (saying
thanks to Claude Code, sharing a thanks story). Internally, this is implemented
under the name **`likes`** — the `likes` DB table, `apps/api/src/apps/likes/`
module, and related frontend hooks/components all use `like`/`likes` terminology,
not `thanks`. New code for this feature (the join table, DTOs, etc.) should follow
the existing `likes` naming convention rather than introducing a `thanks` name.

**Attached award** — An award that has been linked to a specific thanks/`likes`
submission via the new many-to-many join table. A single thanks submission can have
zero, one, or many attached awards; a single award can be attached to many different
submissions (that count is what the `/awards` page displays per award).

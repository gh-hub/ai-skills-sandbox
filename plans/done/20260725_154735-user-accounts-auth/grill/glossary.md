# Glossary: user-accounts-auth

**Like** — the core action a visitor takes on "Thanks, Claude": clicking the
Like button, which creates a row in the `likes` table. A like may optionally
include a story. A like can be anonymous or attributed (see below); either
way it's recorded and counted the same, with no per-user limit.

**Story** / **Review** — the optional testimonial text a visitor can attach
to a like (how Claude/Claude Code helped them), shown on the public story
feed. These two terms are used interchangeably throughout this plan — "story"
matches the existing `likes.story` column and `StoryFeed`/`StoryCard`
component names; "review" is used informally (e.g. "review byline",
"review avatar") when describing the feed's visual presentation.

**Attributed** — describes a like/story whose `user_id` is set to the id of
a logged-in user, i.e. it's linked to a known account. The opposite is
**anonymous**, where `user_id` is null — the same as all likes/stories are
today, before this plan. Whether a like is attributed or anonymous depends
only on whether the visitor was logged in (had a valid session) at the moment
they clicked Like/submitted the story.

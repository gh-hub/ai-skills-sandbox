# Glossary: likes-feed-redesign

**Like** — A row in the `likes` table: a click of the Like button, optionally accompanied by a `story` and/or `hoursSaved`.

**Story** — Free-text testimonial a user optionally attaches to a like, describing how Claude helped them.

**Reported hours saved** — The literal sum of `hoursSaved` across likes where that field was filled in. Does not include any estimate for likes that left it blank.

**Estimated total hours saved** — `reportedHoursSaved / likesWithHoursReported` (average per reporter) multiplied by `totalLikes`, extrapolating the average across everyone including non-reporters.

**Spark mark** — The original, hand-built decorative SVG graphic created for this app's hero section, inspired by (but not a copy of) Claude's own brand mark.

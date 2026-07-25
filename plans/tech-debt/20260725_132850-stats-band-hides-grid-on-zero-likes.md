# stats-band-hides-grid-on-zero-likes

## Finding
`apps/web/components/stats-band.tsx` hides the entire 4-tile equally-weighted stats grid when `totalLikes === 0`, replacing it with a message — reasonable UX but additional behavior beyond what the spec's equal-weight requirement (User Stories 4/5) literally asks for; worth confirming intent.

## Source
- Plan: plans/done/20260725_105431-likes-feed-redesign/
- Round: round-2
- Category: Spec
- Logged: 2026-07-25
- Moved: 2026-07-25

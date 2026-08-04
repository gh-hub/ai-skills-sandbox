# likes-unit-tests-multi-assertion

## Finding
`likes.repository.spec.ts` and `likes.service.spec.ts` (new unit tests) bundle multiple `expect()` calls per test rather than one assertion per test, and the repository spec asserts on Drizzle chain-method calls (implementation detail) rather than purely on observable output. (Standards)

## Source
- Plan: .gh-workflows/plans/done/20260725_135937-cli-hero-and-backend-restructure/
- Round: round-1
- Category: Standards
- Logged: 2026-07-25
- Moved: 2026-07-25

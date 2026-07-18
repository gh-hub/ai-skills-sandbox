# retry-button-not-shadcn

## Finding
The new like-count retry control in `page.tsx` is a raw `<button>`, while the sibling share-story toggle was converted to shadcn `Button` in this same plan — reintroduces the "inconsistent UI component" pattern spec item 9 was meant to eliminate, in a new spot. (Spec)

## Source
- Plan: plans/done/20260718_163935-tech-debt-cleanup/
- Round: round-2
- Category: Spec
- Logged: 2026-07-18
- Moved: 2026-07-18

# 05 — Landing-page hero & footer restructure

**What to build:** Restructure `app/page.tsx` from its current single-column form layout into a landing-page composition — hero (headline + spark mark + the existing like button and story form, repositioned) and a footer — so the page reads as a real product page rather than a bare form. This ticket lays out the structural shell that tickets 06 and 07 will slot the stats band and story feed into.

**Blocked by:** 03 (warm palette theme tokens), 04 (spark mark component)

**Status:** ready

- [ ] `app/page.tsx` has a hero section: headline, the spark mark component (ticket 04), and the existing "Like" button + "Share a story" form (same fields, same submit behavior as today).
- [ ] A footer section exists (simple, on-brand with the new palette).
- [ ] The page has a clear placeholder/insertion point between hero and footer where the stats band (ticket 06) and story feed (ticket 07) will be added.
- [ ] Like submission and story submission continue to work exactly as before (same validation, same success/error handling) in the new layout.
- [ ] Layout uses the warm palette tokens from ticket 03 and renders correctly in both light and dark mode.
- [ ] Existing Playwright tests for the like flow and story form flow (`like-flow.spec.ts`, `story-form-flow.spec.ts`) still pass against the restructured layout (update selectors if structure changed).

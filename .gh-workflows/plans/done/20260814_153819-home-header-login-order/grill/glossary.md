# Glossary: home-header-login-order

## Hero card

The bordered card on the home page (`apps/web/app/page.tsx`, outer div at line ~130) that wraps both the hero's top bar and the hero's body content. It includes the dots, "Thanks, Claude (code)" title, the in-card login control, and below that the welcome text, SparkMark, tips section, "what's new", and statistics. Currently tracked for visibility at the card level (full height), soon to be retargeted to track only its top bar.

## Hero's top bar / Head of the hero

The narrow horizontal strip at the top of the hero card (lines 134–146 in `apps/web/app/page.tsx`) that contains the menu dots, the "Thanks, Claude (code)" h1 title, and its own `HeaderAuthControl` copy. This is the element whose visibility will be tracked by the hero-visibility observer after the fix, replacing the observation of the full card. The site header's login control fades in/out based on this top bar's visibility.

## Site header

The fixed global header component (`apps/web/components/site-header.tsx`) present at the top of every route. It displays a "Thanks, Claude" span on the left and a right-side group containing an Awards link, a ThemeToggle, and a login-control slot. The login-control slot wraps `HeaderAuthControl` and fades in/out based on the hero's visibility. This task reorders the right-side items when the login control is hidden (hero top bar visible).

## heroVisible

The boolean context value exported by `hero-visibility-context.tsx` (`useHeroVisibility()`) that tracks whether the hero (specifically, after the fix, the hero's top bar) is currently on screen. Defaults to `false` on every non-home route, ensuring the site header's login control is always visible there. On the home page, it flips to `true` while the hero's top bar is visible and to `false` once the top bar scrolls past. Both the login fade transition and the Awards/ThemeToggle reorder are driven by this single `heroVisible` boolean.

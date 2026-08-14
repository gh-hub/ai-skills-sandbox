import { expect, test, type Page } from "@playwright/test";

// The global SiteHeader (mounted in layout.tsx, present on every route) is always
// mounted on home too — HeaderAuthControl's visibility there is animated via
// opacity/transform, not mount/unmount — so Playwright's toBeVisible(), which only
// checks display/visibility and bounding box (not opacity), would report it
// "visible" even while faded out. Asserting on the computed opacity directly is
// what actually reflects whether it's shown to the user.
//
// Scoped to page.getByTestId("site-header") throughout: the home page's hero card
// renders its own separate, always-shown HeaderAuthControl copy in its title bar,
// unaffected by scroll — a bare role/testid query would match both.

// The hero's top bar (the strip with the traffic-light dots, "Thanks, Claude
// (code)" title, and its own login control) is what the visibility trigger now
// tracks — not the full hero card below it. Identified by its own heading text
// rather than a hardcoded pixel offset, so this doesn't drift if hero markup
// changes.
async function scrollJustPastHeroTopBar(page: Page) {
  const heroTopBarBottom = await page.evaluate(() => {
    const heading = Array.from(document.querySelectorAll("h1")).find(
      (el) => el.textContent === "Thanks, Claude (code)"
    );
    const topBar = heading?.closest("div");
    if (!topBar) {
      throw new Error("Could not locate hero top bar element");
    }
    return topBar.getBoundingClientRect().bottom + window.scrollY;
  });

  await page.evaluate(
    (targetY) => window.scrollTo(0, targetY + 1),
    heroTopBarBottom
  );
}

test("the global header's login control fades in once the hero's top bar scrolls past, and hides again on scroll back up", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const siteHeader = page.getByTestId("site-header");

  await expect(siteHeader.getByText("Thanks, Claude")).toBeVisible();
  await expect(siteHeader.getByRole("link", { name: "Awards" })).toBeVisible();
  await expect(
    siteHeader.getByRole("button", { name: "Toggle theme" })
  ).toBeVisible();

  const authFadeWrapper = siteHeader.getByTestId("header-auth-fade");
  await expect(authFadeWrapper).toHaveCSS("opacity", "0");

  await scrollJustPastHeroTopBar(page);
  await expect(authFadeWrapper).toHaveCSS("opacity", "1");

  await page.evaluate(() => window.scrollTo(0, 0));
  await expect(authFadeWrapper).toHaveCSS("opacity", "0");
});

test("the Awards link and mode toggle sit after the login-control slot while it's hidden, and before it once shown", async ({
  page,
}) => {
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  const siteHeader = page.getByTestId("site-header");
  const awardsLink = siteHeader.getByRole("link", { name: "Awards" });
  const themeToggle = siteHeader.getByRole("button", { name: "Toggle theme" });
  const authFadeWrapper = siteHeader.getByTestId("header-auth-fade");

  // Hero's top bar still on screen: login-control slot is hidden, so Awards
  // and the mode toggle render after it (order changes visual position, not
  // DOM order, so this must be checked via bounding-box x, not query order).
  await expect(authFadeWrapper).toHaveCSS("opacity", "0");

  const authFadeBoxHidden = await authFadeWrapper.boundingBox();
  const awardsBoxHidden = await awardsLink.boundingBox();
  const themeToggleBoxHidden = await themeToggle.boundingBox();
  if (!authFadeBoxHidden || !awardsBoxHidden || !themeToggleBoxHidden) {
    throw new Error("Expected bounding boxes for header elements");
  }
  expect(awardsBoxHidden.x).toBeGreaterThan(authFadeBoxHidden.x);
  expect(themeToggleBoxHidden.x).toBeGreaterThan(authFadeBoxHidden.x);

  // Scroll past the hero's top bar: login-control slot becomes visible, and
  // Awards + mode toggle snap back to their default position, before it.
  await scrollJustPastHeroTopBar(page);
  await expect(authFadeWrapper).toHaveCSS("opacity", "1");

  const authFadeBoxShown = await authFadeWrapper.boundingBox();
  const awardsBoxShown = await awardsLink.boundingBox();
  const themeToggleBoxShown = await themeToggle.boundingBox();
  if (!authFadeBoxShown || !awardsBoxShown || !themeToggleBoxShown) {
    throw new Error("Expected bounding boxes for header elements");
  }
  expect(awardsBoxShown.x).toBeLessThan(authFadeBoxShown.x);
  expect(themeToggleBoxShown.x).toBeLessThan(authFadeBoxShown.x);
});

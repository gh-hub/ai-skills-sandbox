import { expect, test } from "@playwright/test";

test("clicking Share a story opens a modal and the button label never changes", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Share a story" })).not.toBeVisible();

  await page.getByRole("button", { name: "Share a story" }).click();

  await expect(page.getByRole("heading", { name: "Share a story" })).toBeVisible();
  await expect(page.getByLabel("Story (optional)")).toBeVisible();
  await expect(page.getByLabel("Hours saved (optional)")).toBeVisible();
  await expect(page.getByText("Awards (optional)")).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();

  await page.getByRole("button", { name: "Cancel" }).click();

  // The trigger button keeps its static label after the modal closes — it
  // never flips to a "Hide story" state the way the old inline toggle did.
  await expect(
    page.getByRole("button", { name: "Share a story" })
  ).toBeVisible();
});

test("Cancel closes the modal and resets the form", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Share a story" }).click();
  await page.getByLabel("Story (optional)").fill("A story I changed my mind about.");
  await page.getByRole("button", { name: "Cancel" }).click();

  await expect(page.getByRole("heading", { name: "Share a story" })).not.toBeVisible();

  await page.getByRole("button", { name: "Share a story" }).click();
  await expect(page.getByLabel("Story (optional)")).toHaveValue("");
});

test("while the story submission is pending, Cancel and Submit are both disabled", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "Share a story" }).click();
  await page.getByLabel("Story (optional)").fill("Claude helped me a lot.");

  // The real submit endpoint normally resolves too fast in this test
  // environment to reliably observe the mutation's pending window, so this
  // route is intercepted and held briefly before continuing to the network —
  // mirroring the pattern used for the logout confirm dialog in
  // auth-flow.spec.ts.
  await page.route("**/api/likes", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    await route.continue();
  });

  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("button", { name: "Cancel" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();

  await expect(page.getByRole("heading", { name: "Share a story" })).not.toBeVisible();
});

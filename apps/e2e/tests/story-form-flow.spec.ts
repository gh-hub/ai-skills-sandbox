import { expect, test } from "@playwright/test";

test("submitting a story collapses the form and increases the like count by exactly one", async ({
  page,
}) => {
  await page.goto("/");

  const likeCount = page.getByText(/\d+ likes/);
  const before = Number((await likeCount.textContent())?.match(/(\d+) likes/)?.[1]);

  await page.getByRole("button", { name: "Share a story" }).click();
  await page.getByLabel("Story (optional)").fill("Claude helped me ship this faster.");
  await page.getByLabel("Hours saved (optional)").fill("3");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("button", { name: "Share a story" })).toBeVisible();
  await expect(likeCount).toContainText(`${before + 1} likes`);
});

test("a negative hours-saved value blocks submission and leaves the like count unchanged", async ({
  page,
}) => {
  await page.goto("/");

  const likeCount = page.getByText(/\d+ likes/);
  const before = Number((await likeCount.textContent())?.match(/(\d+) likes/)?.[1]);

  await page.getByRole("button", { name: "Share a story" }).click();
  await page.getByLabel("Hours saved (optional)").fill("-5");
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByText("Hours saved must be zero or greater")).toBeVisible();
  await expect(page.getByRole("button", { name: "Hide story" })).toBeVisible();
  await expect(likeCount).toContainText(`${before} likes`);
});

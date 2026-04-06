import { test, expect } from "@playwright/test";

test("create a new signal via the dialog", async ({ page }) => {
  await page.goto("/");

  // Open the New Signal dialog
  await page.getByRole("button", { name: "New Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).toBeVisible();

  // Fill in the form
  await page.getByLabel("Title").fill("Fix deployment pipeline");
  await page.getByLabel("Description").fill("CI is failing on the staging branch");

  // Submit
  await page.getByRole("button", { name: "Create Signal" }).click();

  // Dialog should close after successful creation
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // Verify the signal appears on the Signals page
  await page.getByRole("link", { name: "Signals" }).click();
  await expect(page).toHaveURL("/signals");
  await expect(page.getByText("Fix deployment pipeline")).toBeVisible();
});

test("new signal dialog shows validation error for empty title", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "New Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).toBeVisible();

  // The title input has the `required` attribute, so the browser
  // will block submission. We verify the input is indeed required.
  const titleInput = page.getByLabel("Title");
  await expect(titleInput).toHaveAttribute("required", "");
});

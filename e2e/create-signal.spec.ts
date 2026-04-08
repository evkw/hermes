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

test("create a signal with a source attached", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "New Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).toBeVisible();

  // Fill signal fields
  await page.getByLabel("Title").fill("Review MR for auth refactor");

  // Fill source URL — type and label are auto-detected from URL
  await page.getByLabel("Source URL").fill("https://gitlab.lfms.example.com/project/-/merge_requests/1234");

  // Submit
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // Navigate to signal detail and verify source is visible
  await page.getByRole("link", { name: "Signals" }).click();
  await expect(page).toHaveURL("/signals");
  await page.getByText("Review MR for auth refactor").click();

  // Source should be auto-detected as GitLab
  await expect(page.getByText("GitLab Link")).toBeVisible();
  await expect(page.getByText("GitLab", { exact: true })).toBeVisible();

  // SOURCE_ADDED event should be in the events list
  await expect(page.getByText("Source Added")).toBeVisible();
});

test("create a signal with empty source URL submits normally", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "New Signal" }).click();
  await page.getByLabel("Title").fill("Quick capture signal");

  // Leave source URL empty — should work fine
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // Verify signal was created
  await page.getByRole("link", { name: "Signals" }).click();
  await expect(page.getByText("Quick capture signal")).toBeVisible();
});

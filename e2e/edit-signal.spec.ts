import { test, expect } from "@playwright/test";

test("edit a signal title and description from the signals table", async ({ page }) => {
  // 1. Create a new signal
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).toBeVisible();

  const originalTitle = `Edit test ${Date.now()}`;
  await page.getByLabel("Title").fill(originalTitle);
  await page.getByLabel("Description").fill("Original description");
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // 2. Navigate to Signals table
  await page.getByRole("link", { name: "Signals" }).click();
  await expect(page).toHaveURL("/signals");
  await expect(page.getByText(originalTitle)).toBeVisible();

  // 3. Click Edit on the signal's row
  const row = page.getByRole("row").filter({ hasText: originalTitle });
  await row.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit Signal" })).toBeVisible();

  // 4. Update the title and description
  const updatedTitle = `Updated title ${Date.now()}`;
  await page.getByLabel("Title").clear();
  await page.getByLabel("Title").fill(updatedTitle);
  await page.getByLabel("Description").clear();
  await page.getByLabel("Description").fill("Updated description");
  await page.getByRole("button", { name: "Save" }).click();

  // Dialog should close
  await expect(page.getByRole("heading", { name: "Edit Signal" })).not.toBeVisible();

  // 5. Verify updated title is visible in the signals table
  await expect(page.getByText(updatedTitle)).toBeVisible();

  // 6. Navigate to signal detail and verify updated fields
  const updatedRow = page.getByRole("row").filter({ hasText: updatedTitle });
  await updatedRow.click();
  await expect(page.locator("h1")).toContainText(updatedTitle);
  await expect(page.getByText("Updated description")).toBeVisible();
});

test("edit a signal from the detail page", async ({ page }) => {
  // 1. Create a new signal
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();

  const originalTitle = `Detail edit ${Date.now()}`;
  await page.getByLabel("Title").fill(originalTitle);
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // 2. Navigate to the signal detail page
  await page.getByRole("link", { name: "Signals" }).click();
  const row = page.getByRole("row").filter({ hasText: originalTitle });
  await row.click();
  await expect(page.locator("h1")).toContainText(originalTitle);

  // 3. Click Edit on the detail page
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByRole("heading", { name: "Edit Signal" })).toBeVisible();

  // 4. Update the title
  const updatedTitle = `Detail updated ${Date.now()}`;
  await page.getByLabel("Title").clear();
  await page.getByLabel("Title").fill(updatedTitle);
  await page.getByRole("button", { name: "Save" }).click();

  // 5. Verify the detail page reflects the changes
  await expect(page.getByRole("heading", { name: "Edit Signal" })).not.toBeVisible();
  await expect(page.locator("h1")).toContainText(updatedTitle);
});

test("edit dialog pre-populates with current values", async ({ page }) => {
  // 1. Create a signal with description
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();

  const title = `Prefill test ${Date.now()}`;
  const description = "Some important context";
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Description").fill(description);
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // 2. Open Edit from the signals table
  await page.getByRole("link", { name: "Signals" }).click();
  const row = page.getByRole("row").filter({ hasText: title });
  await row.getByRole("button", { name: "Edit" }).click();

  // 3. Verify fields are pre-populated
  await expect(page.getByLabel("Title")).toHaveValue(title);
  await expect(page.getByLabel("Description")).toHaveValue(description);
});

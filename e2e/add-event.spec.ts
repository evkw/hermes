import { test, expect } from "@playwright/test";

test("create a signal then add a note event to it", async ({ page }) => {
  // 1. Create a new signal
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).toBeVisible();

  const signalTitle = `Test signal ${Date.now()}`;
  await page.getByLabel("Title").fill(signalTitle);
  await page.getByLabel("Description").fill("Signal created for event test");
  await page.getByRole("button", { name: "Create Signal" }).click();

  // Dialog should close
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  // 2. Navigate to Signals table
  await page.getByRole("link", { name: "Signals" }).click();
  await expect(page).toHaveURL("/signals");
  await expect(page.getByText(signalTitle)).toBeVisible();

  // 3. Open the "+ Event" dialog for this signal's row
  const row = page.getByRole("row").filter({ hasText: signalTitle });
  await row.getByRole("button", { name: "+ Event" }).click();
  await expect(page.getByRole("heading", { name: "Add Event" })).toBeVisible();

  // 4. Fill in the note and submit
  await page.getByLabel("Note").fill("Initial progress update — requirements gathered");
  await page.getByRole("button", { name: "Add Event" }).click();

  // Dialog should close after success
  await expect(page.getByRole("heading", { name: "Add Event" })).not.toBeVisible();

  // 5. Navigate to the signal's events page and verify the event exists
  await row.click();
  await expect(page.locator("h1")).toContainText(signalTitle);
  await expect(page.getByText("Initial progress update — requirements gathered")).toBeVisible();
});

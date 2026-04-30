import { test, expect } from "@playwright/test";

/** Helper: create a signal and navigate to its detail page. */
async function createSignalAndOpenDetail(page: import("@playwright/test").Page, title: string) {
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).toBeVisible();

  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(page.getByRole("heading", { name: "New Signal" })).not.toBeVisible();

  await page.getByRole("link", { name: "Signals" }).click();
  await expect(page).toHaveURL("/signals");
  await page.getByText(title).click();
  await expect(page.locator("h1")).toContainText(title);
}

/** Helper: open the Add Checklist Item dialog. */
async function openAddItemDialog(page: import("@playwright/test").Page) {
  await page.getByText("Add item", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Add Checklist Item" })).toBeVisible();
}

test("add a checklist item to a signal", async ({ page }) => {
  const title = `Checklist test ${Date.now()}`;
  await createSignalAndOpenDetail(page, title);

  // Open the add-item dialog
  await openAddItemDialog(page);

  // Fill and submit
  await page.getByLabel("Title").fill("Test expired password login path");
  await page.getByLabel("Note").fill("Check edge case with expired creds");
  await page.getByRole("button", { name: "Add Item" }).click();

  // Dialog should close
  await expect(page.getByRole("heading", { name: "Add Checklist Item" })).not.toBeVisible();

  // Item should appear in the checklist section
  await expect(page.getByText("Test expired password login path", { exact: true })).toBeVisible();
  await expect(page.getByText("Check edge case with expired creds", { exact: true })).toBeVisible();

  // Progress should show 0/1 complete
  await expect(page.getByText("0/1 complete")).toBeVisible();
});

test("toggle a checklist item complete and incomplete", async ({ page }) => {
  const title = `Toggle checklist ${Date.now()}`;
  await createSignalAndOpenDetail(page, title);

  // Add a checklist item
  await openAddItemDialog(page);
  await page.getByLabel("Title").fill("Verify MFA reset path");
  await page.getByRole("button", { name: "Add Item" }).click();
  await expect(page.getByRole("heading", { name: "Add Checklist Item" })).not.toBeVisible();
  await expect(page.getByText("0/1 complete")).toBeVisible();

  // Mark complete
  await page.getByRole("button", { name: 'Mark "Verify MFA reset path" complete' }).click();
  await expect(page.getByText("1/1 complete")).toBeVisible();

  // Text should be struck through (line-through class)
  const itemText = page.getByText("Verify MFA reset path", { exact: true });
  await expect(itemText).toHaveClass(/line-through/);

  // Mark incomplete
  await page.getByRole("button", { name: 'Mark "Verify MFA reset path" incomplete' }).click();
  await expect(page.getByText("0/1 complete")).toBeVisible();
  const itemTextAfter = page.getByText("Verify MFA reset path", { exact: true });
  await expect(itemTextAfter).not.toHaveClass(/line-through/);
});

test("resolve signal with incomplete checklist items shows confirmation", async ({ page }) => {
  const title = `Resolve warning ${Date.now()}`;
  await createSignalAndOpenDetail(page, title);

  // Add a checklist item (leave incomplete)
  await openAddItemDialog(page);
  await page.getByLabel("Title").fill("Unfinished action");
  await page.getByRole("button", { name: "Add Item" }).click();
  await expect(page.getByRole("heading", { name: "Add Checklist Item" })).not.toBeVisible();

  // Click resolve
  await page.getByRole("button", { name: "Resolve signal" }).click();

  // Confirmation dialog should appear
  await expect(page.getByRole("heading", { name: "Incomplete Checklist Items" })).toBeVisible();
  await expect(page.getByText("1 incomplete checklist item")).toBeVisible();

  // Cancel — signal should stay active
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("heading", { name: "Incomplete Checklist Items" })).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Resolve signal" })).toBeVisible();
});

test("force-resolve signal with incomplete checklist items", async ({ page }) => {
  const title = `Force resolve ${Date.now()}`;
  await createSignalAndOpenDetail(page, title);

  // Add a checklist item (leave incomplete)
  await openAddItemDialog(page);
  await page.getByLabel("Title").fill("Skippable action");
  await page.getByRole("button", { name: "Add Item" }).click();
  await expect(page.getByRole("heading", { name: "Add Checklist Item" })).not.toBeVisible();

  // Click resolve
  await page.getByRole("button", { name: "Resolve signal" }).click();
  await expect(page.getByRole("heading", { name: "Incomplete Checklist Items" })).toBeVisible();

  // Confirm resolve anyway
  await page.getByRole("button", { name: "Resolve anyway" }).click();

  // Signal should now show the reopen button instead
  await expect(page.getByRole("button", { name: "Reopen signal" })).toBeVisible();
});

test("resolve signal with all checklist items complete shows no confirmation", async ({ page }) => {
  const title = `Clean resolve ${Date.now()}`;
  await createSignalAndOpenDetail(page, title);

  // Add a checklist item
  await openAddItemDialog(page);
  await page.getByLabel("Title").fill("Completed action");
  await page.getByRole("button", { name: "Add Item" }).click();
  await expect(page.getByRole("heading", { name: "Add Checklist Item" })).not.toBeVisible();

  // Complete it
  await page.getByRole("button", { name: 'Mark "Completed action" complete' }).click();
  await expect(page.getByText("1/1 complete")).toBeVisible();

  // Resolve — no confirmation dialog
  await page.getByRole("button", { name: "Resolve signal" }).click();
  await expect(page.getByRole("button", { name: "Reopen signal" })).toBeVisible();
});

import { test, expect, type Page } from "@playwright/test";

/** Open the Edit Signal dialog on the current detail page, set owner, and save. */
async function setOwnerViaEditDialog(page: Page, ownerLabel: string) {
  await page.getByRole("button", { name: "Edit" }).click();
  await expect(
    page.getByRole("heading", { name: "Edit Signal" })
  ).toBeVisible();
  await page.getByLabel("Owner").selectOption({ label: ownerLabel });
  await page.getByRole("button", { name: "Save" }).click();
  await expect(
    page.getByRole("heading", { name: "Edit Signal" })
  ).not.toBeVisible();
}

test("assign an owner to a signal via the edit dialog", async ({ page }) => {
  // Create a person first
  await page.goto("/settings/people");
  await page.getByRole("button", { name: /add/i }).click();
  await page.getByLabel("Name").fill("Alice Owner");
  await page.getByRole("button", { name: "Add Person" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Person" })
  ).not.toBeVisible();

  // Create a signal
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();
  await page.getByLabel("Title").fill("Owner test signal");
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(
    page.getByRole("heading", { name: "New Signal" })
  ).not.toBeVisible();

  // Navigate to signal detail
  await page.getByRole("link", { name: "Signals" }).click();
  await page.getByText("Owner test signal").click();

  // Assign owner via edit dialog
  await setOwnerViaEditDialog(page, "Alice Owner");

  // Verify persists after refresh
  await page.reload();
  await expect(page.getByText("Owner: Alice Owner")).toBeVisible();
});

test("change and clear the owner of a signal", async ({ page }) => {
  // Create two people
  await page.goto("/settings/people");
  await page.getByRole("button", { name: /add/i }).click();
  await page.getByLabel("Name").fill("Bob First");
  await page.getByRole("button", { name: "Add Person" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Person" })
  ).not.toBeVisible();

  await page.getByRole("button", { name: "Add person" }).click();
  await page.getByLabel("Name").fill("Carol Second");
  await page.getByRole("button", { name: "Add Person" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Person" })
  ).not.toBeVisible();

  // Create a signal
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();
  await page.getByLabel("Title").fill("Change owner test");
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(
    page.getByRole("heading", { name: "New Signal" })
  ).not.toBeVisible();

  // Navigate to signal detail
  await page.getByRole("link", { name: "Signals" }).click();
  await page.getByText("Change owner test").click();

  // Assign Bob
  await setOwnerViaEditDialog(page, "Bob First");
  await page.reload();
  await expect(page.getByText("Owner: Bob First")).toBeVisible();

  // Change to Carol
  await setOwnerViaEditDialog(page, "Carol Second");
  await page.reload();
  await expect(page.getByText("Owner: Carol Second")).toBeVisible();

  // Clear owner
  await setOwnerViaEditDialog(page, "No owner");
  await page.reload();
  await expect(page.getByText(/^Owner:/)).not.toBeVisible();
});

test("cannot delete a person assigned as owner", async ({ page }) => {
  // Create a person
  await page.goto("/settings/people");
  await page.getByRole("button", { name: /add/i }).click();
  await page.getByLabel("Name").fill("Protected Person");
  await page.getByRole("button", { name: "Add Person" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Person" })
  ).not.toBeVisible();

  // Create a signal and assign the person via edit dialog
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();
  await page.getByLabel("Title").fill("Protected owner test");
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(
    page.getByRole("heading", { name: "New Signal" })
  ).not.toBeVisible();

  await page.getByRole("link", { name: "Signals" }).click();
  await page.getByText("Protected owner test").click();
  await setOwnerViaEditDialog(page, "Protected Person");

  // Try to delete the person
  await page.goto("/settings/people");
  const row = page.getByText("Protected Person").locator("../..");
  await row.getByRole("button", { name: "Delete" }).click();

  // Confirm deletion in dialog
  await page.getByRole("button", { name: "Delete" }).last().click();

  // Expect error message about assigned signals
  await expect(page.getByText(/assigned as owner/i)).toBeVisible();
});

test("owner displays on inflight signal card", async ({ page }) => {
  // Create a person
  await page.goto("/settings/people");
  await page.getByRole("button", { name: /add/i }).click();
  await page.getByLabel("Name").fill("Display Test Person");
  await page.getByRole("button", { name: "Add Person" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Person" })
  ).not.toBeVisible();

  // Create a signal
  await page.goto("/");
  await page.getByRole("button", { name: "New Signal" }).click();
  await page.getByLabel("Title").fill("Display owner signal");
  await page.getByRole("button", { name: "Create Signal" }).click();
  await expect(
    page.getByRole("heading", { name: "New Signal" })
  ).not.toBeVisible();

  // Navigate to signal detail and assign owner via edit dialog
  await page.getByRole("link", { name: "Signals" }).click();
  await page.getByText("Display owner signal").click();
  await setOwnerViaEditDialog(page, "Display Test Person");

  // Go to inflight page — check owner is shown
  await page.goto("/");
  await expect(page.getByText("Owner: Display Test Person")).toBeVisible();
});

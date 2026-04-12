import { test, expect } from "@playwright/test";

test("create a person", async ({ page }) => {
  await page.goto("/settings/people");
  await expect(page.getByText("People")).toBeVisible();

  // Empty state
  await expect(page.getByText("No people yet")).toBeVisible();

  // Open Add dialog
  await page.getByRole("button", { name: "Add your first person" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Person" })
  ).toBeVisible();

  // Fill form
  await page.getByLabel("Name").fill("Jane Smith");
  await page.getByLabel("Notes").fill("Engineering lead");
  await page.getByRole("button", { name: "Add Person" }).click();

  // Dialog closes, person visible in table
  await expect(
    page.getByRole("heading", { name: "Add Person" })
  ).not.toBeVisible();
  await expect(page.getByText("Jane Smith")).toBeVisible();
  await expect(page.getByText("Engineering lead")).toBeVisible();
});

test("edit a person", async ({ page }) => {
  await page.goto("/settings/people");

  // Create a person first
  await page.getByRole("button", { name: "Add person" }).click();
  await page.getByLabel("Name").fill(`Edit Test ${Date.now()}`);
  await page.getByLabel("Notes").fill("Original notes");
  await page.getByRole("button", { name: "Add Person" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Person" })
  ).not.toBeVisible();

  // Edit the person
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Edit Person" })
  ).toBeVisible();

  await page.getByLabel("Notes").clear();
  await page.getByLabel("Notes").fill("Updated notes");
  await page.getByRole("button", { name: "Save Changes" }).click();

  await expect(
    page.getByRole("heading", { name: "Edit Person" })
  ).not.toBeVisible();
  await expect(page.getByText("Updated notes").first()).toBeVisible();
});

test("delete a person", async ({ page }) => {
  await page.goto("/settings/people");

  // Create a person first
  const name = `Delete Test ${Date.now()}`;
  await page.getByRole("button", { name: "Add person" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Add Person" }).click();
  await expect(page.getByText(name)).toBeVisible();

  // Delete it
  await page.getByRole("button", { name: "Delete" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Delete Person" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Delete" }).click();
  await expect(
    page.getByRole("heading", { name: "Delete Person" })
  ).not.toBeVisible();
});

test("prevents duplicate names", async ({ page }) => {
  await page.goto("/settings/people");

  const name = `Unique Test ${Date.now()}`;

  // Create first person
  await page.getByRole("button", { name: "Add person" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Add Person" }).click();
  await expect(
    page.getByRole("heading", { name: "Add Person" })
  ).not.toBeVisible();
  await expect(page.getByText(name)).toBeVisible();

  // Try to create duplicate
  await page.getByRole("button", { name: "Add person" }).click();
  await page.getByLabel("Name").fill(name);
  await page.getByRole("button", { name: "Add Person" }).click();

  // Should show error
  await expect(
    page.getByText("A person with this name already exists")
  ).toBeVisible();
});

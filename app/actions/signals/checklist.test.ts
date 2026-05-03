import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  signalChecklistItem: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  signalEvent: {
    create: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

import {
  createChecklistItem,
  toggleChecklistItem,
  deleteChecklistItem,
} from "./checklist";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

describe("createChecklistItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when signalId missing", async () => {
    const result = await createChecklistItem(
      { success: false },
      formData({ title: "Task" })
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Signal ID is required");
  });

  it("returns field error when title missing", async () => {
    const result = await createChecklistItem(
      { success: false },
      formData({ signalId: "s1" })
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.title).toBe("Title is required");
  });

  it("creates checklist item and event", async () => {
    const result = await createChecklistItem(
      { success: false },
      formData({ signalId: "s1", title: "Do thing", note: "Details" })
    );

    expect(result.success).toBe(true);
    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

describe("toggleChecklistItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when item not found", async () => {
    mockDb.signalChecklistItem.findUnique.mockResolvedValue(null);

    await toggleChecklistItem("item-1");

    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("marks incomplete item as completed", async () => {
    mockDb.signalChecklistItem.findUnique.mockResolvedValue({
      id: "item-1",
      signalId: "s1",
      title: "Task",
      isCompleted: false,
    });

    await toggleChecklistItem("item-1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });

  it("marks completed item as incomplete", async () => {
    mockDb.signalChecklistItem.findUnique.mockResolvedValue({
      id: "item-1",
      signalId: "s1",
      title: "Task",
      isCompleted: true,
    });

    await toggleChecklistItem("item-1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

describe("deleteChecklistItem", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when item not found", async () => {
    mockDb.signalChecklistItem.findUnique.mockResolvedValue(null);

    await deleteChecklistItem("item-1");

    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("deletes item and creates event", async () => {
    mockDb.signalChecklistItem.findUnique.mockResolvedValue({
      id: "item-1",
      signalId: "s1",
      title: "Task",
    });

    await deleteChecklistItem("item-1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

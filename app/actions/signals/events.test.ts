import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  signal: {
    findUnique: vi.fn(),
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  signalEvent: {
    create: vi.fn(),
  },
  person: {
    findUnique: vi.fn(),
  },
  summaryExclusion: {
    findUnique: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

import {
  createSignalEvent,
  updateSignalOwner,
  toggleSummaryExclusion,
} from "./events";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

describe("createSignalEvent", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when signalId missing", async () => {
    const result = await createSignalEvent(
      { success: false },
      formData({ note: "hello" })
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Signal ID is required");
  });

  it("returns field error when note missing", async () => {
    const result = await createSignalEvent(
      { success: false },
      formData({ signalId: "s1" })
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.note).toBe("Note is required");
  });

  it("creates event and marks worked today if not already", async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    mockDb.signal.findUniqueOrThrow.mockResolvedValue({
      lastWorkedAt: yesterday,
    });

    const result = await createSignalEvent(
      { success: false },
      formData({ signalId: "s1", note: "Update" })
    );

    expect(result.success).toBe(true);
    expect(mockDb.$transaction).toHaveBeenCalled();
  });

  it("skips marking worked if already worked today", async () => {
    const now = new Date();
    mockDb.signal.findUniqueOrThrow.mockResolvedValue({
      lastWorkedAt: now,
    });

    const result = await createSignalEvent(
      { success: false },
      formData({ signalId: "s1", note: "Update" })
    );

    expect(result.success).toBe(true);
    // Transaction should have only 1 operation (event create), not 2
    const transactionArgs = mockDb.$transaction.mock.calls[0][0];
    expect(transactionArgs).toHaveLength(1);
  });
});

describe("updateSignalOwner", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when signalId missing", async () => {
    const result = await updateSignalOwner(
      { success: false },
      formData({})
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Signal ID is required");
  });

  it("returns error when signal not found", async () => {
    mockDb.signal.findUnique.mockResolvedValue(null);

    const result = await updateSignalOwner(
      { success: false },
      formData({ signalId: "s1", ownerId: "p1" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Signal not found");
  });

  it("detects no-op when owner unchanged", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", ownerId: "p1" });

    const result = await updateSignalOwner(
      { success: false },
      formData({ signalId: "s1", ownerId: "p1" })
    );

    expect(result.success).toBe(true);
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("returns error when owner person not found", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", ownerId: null });
    mockDb.person.findUnique.mockResolvedValue(null);

    const result = await updateSignalOwner(
      { success: false },
      formData({ signalId: "s1", ownerId: "p-invalid" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Selected owner not found");
  });
});

describe("toggleSummaryExclusion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when signalId missing", async () => {
    await toggleSummaryExclusion(null, formData({ date: "2026-01-01" }));

    expect(mockDb.summaryExclusion.findUnique).not.toHaveBeenCalled();
  });

  it("does nothing when date format invalid", async () => {
    await toggleSummaryExclusion(null, formData({ signalId: "s1", date: "bad" }));

    expect(mockDb.summaryExclusion.findUnique).not.toHaveBeenCalled();
  });

  it("deletes existing exclusion (toggle off)", async () => {
    mockDb.summaryExclusion.findUnique.mockResolvedValue({ id: "ex-1" });

    await toggleSummaryExclusion(
      null,
      formData({ signalId: "s1", date: "2026-01-15" })
    );

    expect(mockDb.summaryExclusion.delete).toHaveBeenCalledWith({
      where: { id: "ex-1" },
    });
  });

  it("creates exclusion when none exists (toggle on)", async () => {
    mockDb.summaryExclusion.findUnique.mockResolvedValue(null);

    await toggleSummaryExclusion(
      null,
      formData({ signalId: "s1", date: "2026-01-15" })
    );

    expect(mockDb.summaryExclusion.create).toHaveBeenCalledWith({
      data: {
        signalId: "s1",
        date: new Date("2026-01-15T00:00:00.000Z"),
      },
    });
  });
});

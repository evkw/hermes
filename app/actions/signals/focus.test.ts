import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  signal: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
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
  toggleFocusToday,
  markWorkedToday,
  focusSignal,
  unfocusSignal,
  getFocusedSignals,
  displaceAndFocusSignal,
} from "./focus";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

describe("toggleFocusToday", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when signal not found", async () => {
    mockDb.signal.findUnique.mockResolvedValue(null);

    await toggleFocusToday("s1");

    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("adds focus when not focused today", async () => {
    mockDb.signal.findUnique.mockResolvedValue({
      id: "s1",
      focusedOnDate: null,
    });

    await toggleFocusToday("s1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

describe("markWorkedToday", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a transaction to update lastWorkedAt and log event", async () => {
    await markWorkedToday("s1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

describe("focusSignal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns false when signal not found", async () => {
    mockDb.signal.findUnique.mockResolvedValue(null);

    const result = await focusSignal("s1");

    expect(result.success).toBe(false);
  });

  it("returns success when already focused", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", isFocused: true });

    const result = await focusSignal("s1");

    expect(result.success).toBe(true);
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("returns needsDisplacement when at max focused", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", isFocused: false });
    mockDb.signal.count.mockResolvedValue(5);
    mockDb.signal.findMany.mockResolvedValue([
      { id: "a", title: "A" },
      { id: "b", title: "B" },
    ]);

    const result = await focusSignal("s1");

    expect(result.success).toBe(false);
    expect(result.needsDisplacement).toBe(true);
    expect(result.focusedSignals).toHaveLength(2);
  });

  it("focuses signal when under max", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", isFocused: false });
    mockDb.signal.count.mockResolvedValue(3);

    const result = await focusSignal("s1");

    expect(result.success).toBe(true);
    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

describe("unfocusSignal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when signal not found", async () => {
    mockDb.signal.findUnique.mockResolvedValue(null);

    await unfocusSignal("s1");

    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("does nothing when signal not focused", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", isFocused: false });

    await unfocusSignal("s1");

    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("unfocuses a focused signal", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", isFocused: true });

    await unfocusSignal("s1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

describe("getFocusedSignals", () => {
  beforeEach(() => vi.clearAllMocks());

  it("queries for focused active signals", async () => {
    mockDb.signal.findMany.mockResolvedValue([]);

    await getFocusedSignals();

    expect(mockDb.signal.findMany).toHaveBeenCalledWith({
      where: { isFocused: true, status: "active" },
      orderBy: { focusedAt: "asc" },
      select: { id: true, title: true, focusedAt: true },
    });
  });
});

describe("displaceAndFocusSignal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when newSignalId missing", async () => {
    const result = await displaceAndFocusSignal(
      { success: false },
      formData({ displacedSignalId: "d1", reason: "test" })
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("New signal ID is required");
  });

  it("returns error when displacedSignalId missing", async () => {
    const result = await displaceAndFocusSignal(
      { success: false },
      formData({ newSignalId: "n1", reason: "test" })
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Select a signal to displace");
  });

  it("returns error when reason missing", async () => {
    const result = await displaceAndFocusSignal(
      { success: false },
      formData({ newSignalId: "n1", displacedSignalId: "d1" })
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("A reason is required");
  });

  it("returns error when displaced signal is not focused", async () => {
    mockDb.signal.findUnique
      .mockResolvedValueOnce({ id: "n1", title: "New", isFocused: false })
      .mockResolvedValueOnce({ id: "d1", title: "Old", isFocused: false });

    const result = await displaceAndFocusSignal(
      { success: false },
      formData({ newSignalId: "n1", displacedSignalId: "d1", reason: "urgent" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Selected signal is not focused");
  });

  it("performs displacement when valid", async () => {
    mockDb.signal.findUnique
      .mockResolvedValueOnce({ id: "n1", title: "New", isFocused: false })
      .mockResolvedValueOnce({ id: "d1", title: "Old", isFocused: true });

    const result = await displaceAndFocusSignal(
      { success: false },
      formData({ newSignalId: "n1", displacedSignalId: "d1", reason: "urgent" })
    );

    expect(result.success).toBe(true);
    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

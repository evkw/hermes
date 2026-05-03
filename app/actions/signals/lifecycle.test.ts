import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  signal: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  signalEvent: {
    create: vi.fn(),
  },
  signalChecklistItem: {
    count: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

import {
  resolveSignal,
  resolveSignalWithChecklistCheck,
  unresolveSignal,
  increaseRisk,
} from "./signal-lifecycle";

describe("resolveSignal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a transaction to resolve and log event", async () => {
    await resolveSignal("s1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

describe("resolveSignalWithChecklistCheck", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns needsConfirmation when incomplete checklist items exist", async () => {
    mockDb.signalChecklistItem.count.mockResolvedValue(3);

    const result = await resolveSignalWithChecklistCheck("s1");

    expect(result).toEqual({
      resolved: false,
      needsConfirmation: true,
      incompleteCount: 3,
    });
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("resolves when no incomplete items", async () => {
    mockDb.signalChecklistItem.count.mockResolvedValue(0);

    const result = await resolveSignalWithChecklistCheck("s1");

    expect(result).toEqual({ resolved: true });
    expect(mockDb.$transaction).toHaveBeenCalled();
  });

  it("resolves when forced despite incomplete items", async () => {
    const result = await resolveSignalWithChecklistCheck("s1", true);

    expect(result).toEqual({ resolved: true });
    expect(mockDb.signalChecklistItem.count).not.toHaveBeenCalled();
    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

describe("unresolveSignal", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when signal not found", async () => {
    mockDb.signal.findUnique.mockResolvedValue(null);

    await unresolveSignal("s1");

    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("does nothing when signal is not resolved", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", status: "active" });

    await unresolveSignal("s1");

    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("reopens a resolved signal", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", status: "resolved" });

    await unresolveSignal("s1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

describe("increaseRisk", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does nothing when signal not found", async () => {
    mockDb.signal.findUnique.mockResolvedValue(null);

    await increaseRisk("s1");

    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });

  it("escalates active to at_risk", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", riskLevel: "active" });

    await increaseRisk("s1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });

  it("escalates at_risk to needs_attention", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", riskLevel: "at_risk" });

    await increaseRisk("s1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });

  it("stays at needs_attention when already there", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1", riskLevel: "needs_attention" });

    await increaseRisk("s1");

    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  signal: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  signalSource: {
    create: vi.fn(),
  },
  signalEvent: {
    create: vi.fn(),
  },
  person: {
    findUnique: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: mockDb,
}));

vi.mock("@/lib/sources", () => ({
  detectSource: vi.fn().mockResolvedValue({ type: "link", label: "Link" }),
}));

import { createSignal, updateSignal, getSignalWithEvents } from "./crud";

function formData(entries: Record<string, string | string[]>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    if (Array.isArray(value)) {
      for (const v of value) fd.append(key, v);
    } else {
      fd.set(key, value);
    }
  }
  return fd;
}

describe("createSignal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns field error when title is empty", async () => {
    const result = await createSignal({ success: false }, formData({ title: "" }));
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.title).toBe("Title is required");
  });

  it("returns field error when title is missing", async () => {
    const result = await createSignal({ success: false }, formData({}));
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.title).toBe("Title is required");
  });

  it("returns field error for invalid source URL", async () => {
    const result = await createSignal(
      { success: false },
      formData({ title: "Test", sourceUrl: "not-a-url" })
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.sourceUrl).toBe("Invalid URL");
  });

  it("creates signal without source URL", async () => {
    mockDb.signal.create.mockResolvedValue({ id: "sig-1" });

    const result = await createSignal(
      { success: false },
      formData({ title: "  My Signal  ", description: "  Desc  " })
    );

    expect(result.success).toBe(true);
    expect(mockDb.signal.create).toHaveBeenCalledWith({
      data: {
        title: "My Signal",
        description: "Desc",
      },
    });
  });

  it("creates signal with source URL and detects source type", async () => {
    mockDb.signal.create.mockResolvedValue({ id: "sig-1" });

    const result = await createSignal(
      { success: false },
      formData({ title: "Test", sourceUrl: "https://example.com" })
    );

    expect(result.success).toBe(true);
    expect(mockDb.signalSource.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          signalId: "sig-1",
          url: "https://example.com",
        }),
      })
    );
  });

  it("connects streams when streamIds provided", async () => {
    mockDb.signal.create.mockResolvedValue({ id: "sig-1" });

    const result = await createSignal(
      { success: false },
      formData({ title: "Test", streamIds: ["s1", "s2"] })
    );

    expect(result.success).toBe(true);
    expect(mockDb.signal.create).toHaveBeenCalledWith({
      data: {
        title: "Test",
        description: null,
        streams: { connect: [{ id: "s1" }, { id: "s2" }] },
      },
    });
  });

  it("trims whitespace from title and description", async () => {
    mockDb.signal.create.mockResolvedValue({ id: "sig-1" });

    await createSignal(
      { success: false },
      formData({ title: "  hello  ", description: "  world  " })
    );

    expect(mockDb.signal.create).toHaveBeenCalledWith({
      data: { title: "hello", description: "world" },
    });
  });

  it("sets description to null when empty", async () => {
    mockDb.signal.create.mockResolvedValue({ id: "sig-1" });

    await createSignal(
      { success: false },
      formData({ title: "Test", description: "   " })
    );

    expect(mockDb.signal.create).toHaveBeenCalledWith({
      data: { title: "Test", description: null },
    });
  });
});

describe("updateSignal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns error when signalId is missing", async () => {
    const result = await updateSignal({ success: false }, formData({ title: "T" }));
    expect(result.success).toBe(false);
    expect(result.error).toBe("Signal ID is required");
  });

  it("returns field error when title is empty", async () => {
    const result = await updateSignal(
      { success: false },
      formData({ signalId: "s1", title: "" })
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.title).toBe("Title is required");
  });

  it("returns error when signal not found", async () => {
    mockDb.signal.findUnique.mockResolvedValue(null);

    const result = await updateSignal(
      { success: false },
      formData({ signalId: "s1", title: "Updated" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Signal not found");
  });

  it("returns error when owner not found", async () => {
    mockDb.signal.findUnique.mockResolvedValue({
      id: "s1",
      title: "Old",
      description: null,
      ownerId: null,
      streams: [],
    });
    mockDb.person.findUnique.mockResolvedValue(null);

    const result = await updateSignal(
      { success: false },
      formData({ signalId: "s1", title: "Updated", ownerId: "p1" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Selected owner not found");
  });

  it("detects no-op when nothing changed", async () => {
    mockDb.signal.findUnique.mockResolvedValue({
      id: "s1",
      title: "Same",
      description: null,
      ownerId: null,
      streams: [],
    });

    const result = await updateSignal(
      { success: false },
      formData({ signalId: "s1", title: "Same" })
    );

    expect(result.success).toBe(true);
    expect(mockDb.$transaction).not.toHaveBeenCalled();
  });
});

describe("getSignalWithEvents", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("queries with correct includes", async () => {
    mockDb.signal.findUnique.mockResolvedValue({ id: "s1" });

    await getSignalWithEvents("s1");

    expect(mockDb.signal.findUnique).toHaveBeenCalledWith({
      where: { id: "s1" },
      include: {
        owner: true,
        events: { orderBy: { createdAt: "desc" } },
        sources: { orderBy: { createdAt: "desc" } },
        streams: true,
        checklistItems: { orderBy: { createdAt: "asc" } },
      },
    });
  });
});

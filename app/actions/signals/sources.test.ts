import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

const mockDb = vi.hoisted(() => ({
  signalSource: {
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

vi.mock("@/lib/sources", () => ({
  detectSource: vi.fn().mockResolvedValue({ type: "github", label: "GitHub" }),
}));

import {
  createSignalSource,
  updateSignalSource,
  deleteSignalSource,
} from "./sources";

function formData(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(entries)) {
    fd.set(key, value);
  }
  return fd;
}

describe("createSignalSource", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when signalId missing", async () => {
    const result = await createSignalSource(
      { success: false },
      formData({ url: "https://example.com" })
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Signal ID is required");
  });

  it("returns error when url missing", async () => {
    const result = await createSignalSource(
      { success: false },
      formData({ signalId: "s1" })
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.url).toBe("URL is required");
  });

  it("returns error for invalid url", async () => {
    const result = await createSignalSource(
      { success: false },
      formData({ signalId: "s1", url: "not-valid" })
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.url).toBe("Invalid URL");
  });

  it("creates source and event on success", async () => {
    mockDb.signalSource.create.mockResolvedValue({
      id: "src-1",
      signalId: "s1",
      type: "github",
      label: "GitHub",
    });

    const result = await createSignalSource(
      { success: false },
      formData({ signalId: "s1", url: "https://github.com/org/repo" })
    );

    expect(result.success).toBe(true);
    expect(mockDb.signalSource.create).toHaveBeenCalled();
    expect(mockDb.signalEvent.create).toHaveBeenCalled();
  });
});

describe("updateSignalSource", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when sourceId missing", async () => {
    const result = await updateSignalSource(
      { success: false },
      formData({ label: "Test" })
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Source ID is required");
  });

  it("returns error when label missing", async () => {
    const result = await updateSignalSource(
      { success: false },
      formData({ sourceId: "src-1" })
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.label).toBe("Label is required");
  });

  it("returns error for invalid url", async () => {
    const result = await updateSignalSource(
      { success: false },
      formData({ sourceId: "src-1", label: "Test", url: "bad-url" })
    );
    expect(result.success).toBe(false);
    expect(result.fieldErrors?.url).toBe("Invalid URL");
  });

  it("detects no-op when nothing changed", async () => {
    mockDb.signalSource.findUnique.mockResolvedValue({
      id: "src-1",
      type: "manual",
      label: "Test",
      url: null,
      note: null,
    });

    const result = await updateSignalSource(
      { success: false },
      formData({ sourceId: "src-1", label: "Test" })
    );

    expect(result.success).toBe(true);
    expect(mockDb.signalSource.update).not.toHaveBeenCalled();
  });

  it("updates when label changed", async () => {
    mockDb.signalSource.findUnique.mockResolvedValue({
      id: "src-1",
      type: "manual",
      label: "Old",
      url: null,
      note: null,
    });

    const result = await updateSignalSource(
      { success: false },
      formData({ sourceId: "src-1", label: "New" })
    );

    expect(result.success).toBe(true);
    expect(mockDb.signalSource.update).toHaveBeenCalled();
  });
});

describe("deleteSignalSource", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns error when sourceId missing", async () => {
    const result = await deleteSignalSource(
      { success: false },
      formData({})
    );
    expect(result.success).toBe(false);
    expect(result.error).toBe("Source ID is required");
  });

  it("returns error when source not found", async () => {
    mockDb.signalSource.findUnique.mockResolvedValue(null);

    const result = await deleteSignalSource(
      { success: false },
      formData({ sourceId: "src-1" })
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe("Source not found");
  });

  it("deletes source and creates event", async () => {
    mockDb.signalSource.findUnique.mockResolvedValue({
      id: "src-1",
      signalId: "s1",
      type: "link",
      label: "My Link",
    });

    const result = await deleteSignalSource(
      { success: false },
      formData({ sourceId: "src-1" })
    );

    expect(result.success).toBe(true);
    expect(mockDb.$transaction).toHaveBeenCalled();
  });
});

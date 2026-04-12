"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { detectSource } from "@/lib/sources";

export type CreateSignalState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    title?: string;
    sourceUrl?: string;
  };
};

export async function createSignal(
  prevState: CreateSignalState,
  formData: FormData
): Promise<CreateSignalState> {
  const title = formData.get("title");
  const description = formData.get("description");

  if (typeof title !== "string" || title.trim().length === 0) {
    return { success: false, fieldErrors: { title: "Title is required" } };
  }

  const trimmedTitle = title.trim();
  const trimmedDescription =
    typeof description === "string" && description.trim().length > 0
      ? description.trim()
      : null;

  // --- Optional source URL ---
  const rawSourceUrl = formData.get("sourceUrl");
  const trimmedUrl =
    typeof rawSourceUrl === "string" && rawSourceUrl.trim().length > 0
      ? rawSourceUrl.trim()
      : null;

  if (trimmedUrl) {
    try {
      new URL(trimmedUrl);
    } catch {
      return { success: false, fieldErrors: { sourceUrl: "Invalid URL" } };
    }
  }

  if (trimmedUrl) {
    const { type, label } = await detectSource(trimmedUrl);

    const signal = await db.signal.create({
      data: {
        title: trimmedTitle,
        description: trimmedDescription,
      },
    });

    await db.signalSource.create({
      data: {
        signalId: signal.id,
        type,
        label,
        url: trimmedUrl,
      },
    });

    await db.signalEvent.create({
      data: {
        signalId: signal.id,
        eventType: "source_added",
        note: `Source added: ${label}`,
      },
    });
  } else {
    await db.signal.create({
      data: {
        title: trimmedTitle,
        description: trimmedDescription,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/inflight");
  revalidatePath("/signals");

  return { success: true };
}

// --- In-Flight actions ---

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

export async function toggleFocusToday(signalId: string): Promise<void> {
  const signal = await db.signal.findUnique({ where: { id: signalId } });
  if (!signal) return;

  const today = startOfTodayUTC();
  const isFocusedToday =
    signal.focusedOnDate &&
    signal.focusedOnDate.getTime() === today.getTime();

  await db.$transaction([
    db.signal.update({
      where: { id: signalId },
      data: { focusedOnDate: isFocusedToday ? null : today },
    }),
    db.signalEvent.create({
      data: {
        signalId,
        eventType: isFocusedToday ? "edited" : "edited",
        note: isFocusedToday
          ? "Removed from today's focus"
          : "Added to today's focus",
      },
    }),
  ]);

  revalidatePath("/inflight");
  revalidatePath("/signals");
}

export async function markWorkedToday(signalId: string): Promise<void> {
  const now = new Date();

  await db.$transaction([
    db.signal.update({
      where: { id: signalId },
      data: { lastWorkedAt: now },
    }),
    db.signalEvent.create({
      data: {
        signalId,
        eventType: "worked_today",
        note: "Marked as worked today",
      },
    }),
  ]);

  revalidatePath("/inflight");
  revalidatePath("/signals");
}

export type CreateEventState = {
  success: boolean;
  error?: string;
  fieldErrors?: { note?: string };
};

export async function createSignalEvent(
  prevState: CreateEventState,
  formData: FormData
): Promise<CreateEventState> {
  const signalId = formData.get("signalId");
  const note = formData.get("note");
  const link = formData.get("link");

  if (typeof signalId !== "string" || signalId.trim().length === 0) {
    return { success: false, error: "Signal ID is required" };
  }
  if (typeof note !== "string" || note.trim().length === 0) {
    return { success: false, fieldErrors: { note: "Note is required" } };
  }

  const trimmedNote = note.trim();
  const trimmedLink =
    typeof link === "string" && link.trim().length > 0 ? link.trim() : null;

  const events: Parameters<typeof db.signalEvent.create>[0][] = [
    { data: { signalId, eventType: "note_added", note: trimmedNote } },
  ];

  if (trimmedLink) {
    events.push({
      data: { signalId, eventType: "link_attached", link: trimmedLink },
    });
  }

  await db.$transaction(events.map((e) => db.signalEvent.create(e)));

  revalidatePath("/signals");

  return { success: true };
}

export async function resolveSignal(signalId: string): Promise<void> {
  const now = new Date();

  await db.$transaction([
    db.signal.update({
      where: { id: signalId },
      data: {
        status: "resolved",
        resolvedAt: now,
        focusedOnDate: null,
      },
    }),
    db.signalEvent.create({
      data: {
        signalId,
        eventType: "resolved",
        note: "Signal resolved",
      },
    }),
  ]);

  revalidatePath("/inflight");
  revalidatePath("/signals");
}

const RISK_ESCALATION: Record<string, string> = {
  active: "at_risk",
  at_risk: "needs_attention",
  needs_attention: "needs_attention",
};

export async function increaseRisk(signalId: string): Promise<void> {
  const signal = await db.signal.findUnique({ where: { id: signalId } });
  if (!signal) return;

  const nextRisk = RISK_ESCALATION[signal.riskLevel] ?? signal.riskLevel;

  await db.$transaction([
    db.signal.update({
      where: { id: signalId },
      data: { riskLevel: nextRisk as "active" | "at_risk" | "needs_attention" },
    }),
    db.signalEvent.create({
      data: {
        signalId,
        eventType: "risk_increased",
        note: `Risk increased to ${nextRisk.replace("_", " ")}`,
      },
    }),
  ]);

  revalidatePath("/inflight");
  revalidatePath("/signals");
  revalidatePath("/retro");
}

export async function getSignalWithEvents(signalId: string) {
  const signal = await db.signal.findUnique({
    where: { id: signalId },
    include: {
      events: { orderBy: { createdAt: "desc" } },
      sources: { orderBy: { createdAt: "desc" } },
    },
  });

  return signal;
}

// --- Source management ---

export type SourceActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    label?: string;
    url?: string;
  };
};

function buildSourceEventNote(
  action: "added" | "removed",
  fields: { sourceId: string; type: string; label: string }
): string {
  return `Source ${action}: ${fields.label} (sourceId: ${fields.sourceId}, type: ${fields.type})`;
}

export async function createSignalSource(
  prevState: SourceActionState,
  formData: FormData
): Promise<SourceActionState> {
  const signalId = formData.get("signalId");
  const rawUrl = formData.get("url");

  if (typeof signalId !== "string" || signalId.trim().length === 0) {
    return { success: false, error: "Signal ID is required" };
  }

  const trimmedUrl =
    typeof rawUrl === "string" && rawUrl.trim().length > 0 ? rawUrl.trim() : null;

  if (!trimmedUrl) {
    return { success: false, fieldErrors: { url: "URL is required" } };
  }

  try {
    new URL(trimmedUrl);
  } catch {
    return { success: false, fieldErrors: { url: "Invalid URL" } };
  }

  const { type, label } = await detectSource(trimmedUrl);

  const source = await db.signalSource.create({
    data: {
      signalId,
      type,
      label,
      url: trimmedUrl,
    },
  });

  await db.signalEvent.create({
    data: {
      signalId,
      eventType: "source_added",
      note: buildSourceEventNote("added", {
        sourceId: source.id,
        type,
        label,
      }),
    },
  });

  revalidatePath("/signals");
  return { success: true };
}

export async function updateSignalSource(
  prevState: SourceActionState,
  formData: FormData
): Promise<SourceActionState> {
  const sourceId = formData.get("sourceId");
  const type = formData.get("type");
  const label = formData.get("label");
  const url = formData.get("url");
  const note = formData.get("note");

  if (typeof sourceId !== "string" || sourceId.trim().length === 0) {
    return { success: false, error: "Source ID is required" };
  }
  if (typeof label !== "string" || label.trim().length === 0) {
    return { success: false, fieldErrors: { label: "Label is required" } };
  }

  const trimmedLabel = label.trim();
  const trimmedType =
    typeof type === "string" && type.trim().length > 0 ? type.trim() : "manual";
  const trimmedUrl =
    typeof url === "string" && url.trim().length > 0 ? url.trim() : null;
  const trimmedNote =
    typeof note === "string" && note.trim().length > 0 ? note.trim() : null;

  if (trimmedUrl) {
    try {
      new URL(trimmedUrl);
    } catch {
      return { success: false, fieldErrors: { url: "Invalid URL" } };
    }
  }

  const existing = await db.signalSource.findUnique({ where: { id: sourceId } });
  if (!existing) {
    return { success: false, error: "Source not found" };
  }

  // No-op detection: skip write if nothing changed
  if (
    existing.type === trimmedType &&
    existing.label === trimmedLabel &&
    (existing.url ?? null) === trimmedUrl &&
    (existing.note ?? null) === trimmedNote
  ) {
    return { success: true };
  }

  await db.signalSource.update({
    where: { id: sourceId },
    data: {
      type: trimmedType,
      label: trimmedLabel,
      url: trimmedUrl,
      note: trimmedNote,
    },
  });

  revalidatePath("/signals");
  return { success: true };
}

export async function deleteSignalSource(
  prevState: SourceActionState,
  formData: FormData
): Promise<SourceActionState> {
  const sourceId = formData.get("sourceId");

  if (typeof sourceId !== "string" || sourceId.trim().length === 0) {
    return { success: false, error: "Source ID is required" };
  }

  const source = await db.signalSource.findUnique({ where: { id: sourceId } });
  if (!source) {
    return { success: false, error: "Source not found" };
  }

  await db.$transaction([
    db.signalSource.delete({ where: { id: sourceId } }),
    db.signalEvent.create({
      data: {
        signalId: source.signalId,
        eventType: "source_removed",
        note: buildSourceEventNote("removed", {
          sourceId: source.id,
          type: source.type,
          label: source.label,
        }),
      },
    }),
  ]);

  revalidatePath("/signals");
  return { success: true };
}

// --- Edit signal ---

export type UpdateSignalState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    title?: string;
  };
};

export async function updateSignal(
  prevState: UpdateSignalState,
  formData: FormData
): Promise<UpdateSignalState> {
  const signalId = formData.get("signalId");
  const title = formData.get("title");
  const description = formData.get("description");

  if (typeof signalId !== "string" || signalId.trim().length === 0) {
    return { success: false, error: "Signal ID is required" };
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return { success: false, fieldErrors: { title: "Title is required" } };
  }

  const trimmedTitle = title.trim();
  const trimmedDescription =
    typeof description === "string" && description.trim().length > 0
      ? description.trim()
      : null;

  const existing = await db.signal.findUnique({ where: { id: signalId } });
  if (!existing) {
    return { success: false, error: "Signal not found" };
  }

  // No-op detection: skip write if nothing changed
  if (
    existing.title === trimmedTitle &&
    (existing.description ?? null) === trimmedDescription
  ) {
    return { success: true };
  }

  const changes: string[] = [];
  if (existing.title !== trimmedTitle) changes.push("Title updated");
  if ((existing.description ?? null) !== trimmedDescription)
    changes.push("Description updated");

  await db.$transaction([
    db.signal.update({
      where: { id: signalId },
      data: { title: trimmedTitle, description: trimmedDescription },
    }),
    db.signalEvent.create({
      data: {
        signalId,
        eventType: "edited",
        note: changes.join(", "),
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/inflight");
  revalidatePath("/signals");
  revalidatePath("/calendar");

  return { success: true };
}

// --- Unresolve signal ---

export async function unresolveSignal(signalId: string): Promise<void> {
  const signal = await db.signal.findUnique({ where: { id: signalId } });
  if (!signal || signal.status !== "resolved") return;

  await db.$transaction([
    db.signal.update({
      where: { id: signalId },
      data: {
        status: "active",
        resolvedAt: null,
        riskLevel: "active",
      },
    }),
    db.signalEvent.create({
      data: {
        signalId,
        eventType: "reopened",
        note: "Signal reopened",
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/inflight");
  revalidatePath("/signals");
  revalidatePath("/calendar");
}

// --- Summary exclusion ---

export async function toggleSummaryExclusion(
  _prevState: unknown,
  formData: FormData
): Promise<void> {
  const signalId = formData.get("signalId");
  const dateStr = formData.get("date");

  if (typeof signalId !== "string" || signalId.trim().length === 0) return;
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return;

  const date = new Date(dateStr + "T00:00:00.000Z");

  const existing = await db.summaryExclusion.findUnique({
    where: { signalId_date: { signalId, date } },
  });

  if (existing) {
    await db.summaryExclusion.delete({ where: { id: existing.id } });
  } else {
    await db.summaryExclusion.create({ data: { signalId, date } });
  }

  revalidatePath("/calendar");
}

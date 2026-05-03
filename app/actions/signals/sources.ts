"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { detectSource } from "@/lib/sources";

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

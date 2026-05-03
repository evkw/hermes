"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

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

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const signal = await db.signal.findUniqueOrThrow({
    where: { id: signalId },
    select: { lastWorkedAt: true },
  });

  const alreadyWorkedToday =
    signal.lastWorkedAt !== null && signal.lastWorkedAt >= startOfDay;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [
    db.signalEvent.create({
      data: { signalId, eventType: "note_added", note: trimmedNote },
    }),
  ];

  if (trimmedLink) {
    ops.push(
      db.signalEvent.create({
        data: { signalId, eventType: "link_attached", link: trimmedLink },
      })
    );
  }

  if (!alreadyWorkedToday) {
    ops.push(
      db.signal.update({
        where: { id: signalId },
        data: { lastWorkedAt: now },
      })
    );
  }

  await db.$transaction(ops);

  revalidatePath("/signals");
  revalidatePath("/inflight");
  revalidatePath("/calendar");

  return { success: true };
}

export type UpdateOwnerState = {
  success: boolean;
  error?: string;
};

export async function updateSignalOwner(
  prevState: UpdateOwnerState,
  formData: FormData
): Promise<UpdateOwnerState> {
  const signalId = formData.get("signalId");
  const rawOwnerId = formData.get("ownerId");

  if (typeof signalId !== "string" || signalId.trim().length === 0) {
    return { success: false, error: "Signal ID is required" };
  }

  const ownerId =
    typeof rawOwnerId === "string" && rawOwnerId.trim().length > 0
      ? rawOwnerId.trim()
      : null;

  const signal = await db.signal.findUnique({ where: { id: signalId } });
  if (!signal) {
    return { success: false, error: "Signal not found" };
  }

  // No-op detection
  if ((signal.ownerId ?? null) === ownerId) {
    return { success: true };
  }

  // Validate owner exists if provided
  if (ownerId) {
    const person = await db.person.findUnique({ where: { id: ownerId } });
    if (!person) {
      return { success: false, error: "Selected owner not found" };
    }
  }

  let ownerNote: string;
  if (ownerId) {
    const person = await db.person.findUnique({ where: { id: ownerId } });
    ownerNote = `Owner set to ${person!.name}`;
  } else {
    ownerNote = "Owner removed";
  }

  await db.$transaction([
    db.signal.update({
      where: { id: signalId },
      data: { ownerId },
    }),
    db.signalEvent.create({
      data: {
        signalId,
        eventType: "owner_changed",
        note: ownerNote,
      },
    }),
  ]);

  revalidatePath("/inflight");
  revalidatePath("/signals");

  return { success: true };
}

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

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type CreateSignalState = {
  success: boolean;
  error?: string;
  fieldErrors?: { title?: string };
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

  await db.signal.create({
    data: {
      title: trimmedTitle,
      description: trimmedDescription,
    },
  });

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
    },
  });

  return signal;
}

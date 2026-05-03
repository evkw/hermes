"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type ActiveFocusSession = {
  id: string;
  signalId: string;
  signalTitle: string;
  startedAt: string; // ISO string for serialization to client
  durationMinutes: number;
};

export async function getActiveFocusSession(): Promise<ActiveFocusSession | null> {
  const session = await db.focusSession.findFirst({
    where: { endedAt: null },
    include: { signal: { select: { title: true } } },
    orderBy: { startedAt: "desc" },
  });

  if (!session) return null;

  return {
    id: session.id,
    signalId: session.signalId,
    signalTitle: session.signal.title,
    startedAt: session.startedAt.toISOString(),
    durationMinutes: session.durationMinutes,
  };
}

export async function startFocusSession(
  signalId: string,
  durationMinutes: number
): Promise<{ success: boolean; error?: string }> {
  if (![15, 30, 60].includes(durationMinutes)) {
    return { success: false, error: "Invalid duration" };
  }

  const [existingSession, signal] = await Promise.all([
    db.focusSession.findFirst({ where: { endedAt: null } }),
    db.signal.findUnique({
      where: { id: signalId },
      select: { id: true, status: true },
    }),
  ]);

  if (existingSession) {
    return { success: false, error: "A focus session is already active" };
  }

  if (!signal) {
    return { success: false, error: "Signal not found" };
  }

  if (signal.status !== "active") {
    return { success: false, error: "Cannot start a session on a resolved signal" };
  }

  await db.focusSession.create({
    data: { signalId, durationMinutes },
  });

  revalidatePath("/", "layout");
  revalidatePath("/inflight");
  revalidatePath("/signals");

  return { success: true };
}

export async function endFocusSession(
  sessionId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await db.focusSession.findUnique({
    where: { id: sessionId },
    include: { signal: { select: { id: true, title: true } } },
  });

  if (!session) {
    return { success: false, error: "Session not found" };
  }

  if (session.endedAt) {
    return { success: false, error: "Session already ended" };
  }

  const now = new Date();
  const elapsedMs = now.getTime() - session.startedAt.getTime();
  const elapsedMinutes = Math.round(elapsedMs / 60_000);
  const totalMinutes = session.durationMinutes;

  const isEarlyEnd = elapsedMinutes < totalMinutes;
  const note = isEarlyEnd
    ? `Focus session ended early (${elapsedMinutes} of ${totalMinutes} min)`
    : `Focus session completed (${totalMinutes} min)`;

  await db.$transaction([
    db.focusSession.update({
      where: { id: sessionId },
      data: { endedAt: now },
    }),
    db.signalEvent.create({
      data: {
        signalId: session.signalId,
        eventType: "focus_session_completed",
        note,
      },
    }),
    db.signal.update({
      where: { id: session.signalId },
      data: { lastWorkedAt: now },
    }),
  ]);

  revalidatePath("/", "layout");
  revalidatePath("/inflight");
  revalidatePath("/signals");
  revalidatePath(`/signals/${session.signalId}/events`);

  return { success: true };
}

export async function addFocusSessionNote(
  sessionId: string,
  note: string
): Promise<{ success: boolean; error?: string }> {
  const trimmed = note.trim();
  if (trimmed.length === 0) {
    return { success: false, error: "Note cannot be empty" };
  }

  const session = await db.focusSession.findUnique({
    where: { id: sessionId },
  });

  if (!session || session.endedAt) {
    return { success: false, error: "No active session found" };
  }

  const now = new Date();

  await db.$transaction([
    db.signalEvent.create({
      data: {
        signalId: session.signalId,
        eventType: "note_added",
        note: trimmed,
      },
    }),
    db.signal.update({
      where: { id: session.signalId },
      data: { lastWorkedAt: now },
    }),
  ]);

  revalidatePath("/inflight");
  revalidatePath("/signals");
  revalidatePath(`/signals/${session.signalId}/events`);

  return { success: true };
}

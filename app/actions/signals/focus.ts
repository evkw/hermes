"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

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

const MAX_FOCUSED_SIGNALS = 5;

export async function getFocusedSignals() {
  return db.signal.findMany({
    where: { isFocused: true, status: "active" },
    orderBy: { focusedAt: "asc" },
    select: { id: true, title: true, focusedAt: true },
  });
}

export async function focusSignal(signalId: string): Promise<{ success: boolean; needsDisplacement?: boolean; focusedSignals?: { id: string; title: string }[] }> {
  const signal = await db.signal.findUnique({ where: { id: signalId } });
  if (!signal) return { success: false };
  if (signal.isFocused) return { success: true };

  const focusedCount = await db.signal.count({ where: { isFocused: true, status: "active" } });

  if (focusedCount >= MAX_FOCUSED_SIGNALS) {
    const focusedSignals = await db.signal.findMany({
      where: { isFocused: true, status: "active" },
      orderBy: { focusedAt: "asc" },
      select: { id: true, title: true },
    });
    return { success: false, needsDisplacement: true, focusedSignals };
  }

  const now = new Date();
  await db.$transaction([
    db.signal.update({
      where: { id: signalId },
      data: { isFocused: true, focusedAt: now },
    }),
    db.signalEvent.create({
      data: {
        signalId,
        eventType: "focused",
        note: "Took focus",
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/inflight");
  revalidatePath("/signals");
  return { success: true };
}

export async function unfocusSignal(signalId: string): Promise<void> {
  const signal = await db.signal.findUnique({ where: { id: signalId } });
  if (!signal || !signal.isFocused) return;

  await db.$transaction([
    db.signal.update({
      where: { id: signalId },
      data: { isFocused: false, focusedAt: null },
    }),
    db.signalEvent.create({
      data: {
        signalId,
        eventType: "unfocused",
        note: "Removed from focus",
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/inflight");
  revalidatePath("/signals");
}

export type DisplaceSignalState = {
  success: boolean;
  error?: string;
};

export async function displaceAndFocusSignal(
  prevState: DisplaceSignalState,
  formData: FormData
): Promise<DisplaceSignalState> {
  const newSignalId = formData.get("newSignalId");
  const displacedSignalId = formData.get("displacedSignalId");
  const reason = formData.get("reason");

  if (typeof newSignalId !== "string" || newSignalId.trim().length === 0) {
    return { success: false, error: "New signal ID is required" };
  }
  if (typeof displacedSignalId !== "string" || displacedSignalId.trim().length === 0) {
    return { success: false, error: "Select a signal to displace" };
  }
  if (typeof reason !== "string" || reason.trim().length === 0) {
    return { success: false, error: "A reason is required" };
  }

  const trimmedReason = reason.trim();

  const [newSignal, displacedSignal] = await Promise.all([
    db.signal.findUnique({ where: { id: newSignalId }, select: { id: true, title: true, isFocused: true } }),
    db.signal.findUnique({ where: { id: displacedSignalId }, select: { id: true, title: true, isFocused: true } }),
  ]);

  if (!newSignal) return { success: false, error: "Signal not found" };
  if (!displacedSignal) return { success: false, error: "Displaced signal not found" };
  if (!displacedSignal.isFocused) return { success: false, error: "Selected signal is not focused" };

  const now = new Date();

  await db.$transaction([
    // Unfocus the displaced signal
    db.signal.update({
      where: { id: displacedSignalId },
      data: { isFocused: false, focusedAt: null },
    }),
    // Focus the new signal
    db.signal.update({
      where: { id: newSignalId },
      data: { isFocused: true, focusedAt: now },
    }),
    // Event on newly focused signal
    db.signalEvent.create({
      data: {
        signalId: newSignalId,
        eventType: "focused",
        note: `Took focus because: ${trimmedReason}`,
      },
    }),
    // Event on displaced signal
    db.signalEvent.create({
      data: {
        signalId: displacedSignalId,
        eventType: "focus_displaced",
        note: `Lost focus to ${newSignal.title} because: ${trimmedReason}`,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/inflight");
  revalidatePath("/signals");
  return { success: true };
}

"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type ResolveSignalResult = {
  resolved: true;
} | {
  resolved: false;
  needsConfirmation: true;
  incompleteCount: number;
};

export async function resolveSignal(signalId: string): Promise<void> {
  const now = new Date();

  await db.$transaction([
    db.signal.update({
      where: { id: signalId },
      data: {
        status: "resolved",
        resolvedAt: now,
        focusedOnDate: null,
        isFocused: false,
        focusedAt: null,
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

export async function resolveSignalWithChecklistCheck(
  signalId: string,
  force?: boolean
): Promise<ResolveSignalResult> {
  if (!force) {
    const incompleteCount = await db.signalChecklistItem.count({
      where: { signalId, isCompleted: false },
    });
    if (incompleteCount > 0) {
      return { resolved: false, needsConfirmation: true, incompleteCount };
    }
  }

  await resolveSignal(signalId);
  return { resolved: true };
}

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

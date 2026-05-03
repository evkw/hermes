"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type ChecklistItemState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    title?: string;
  };
};

export async function createChecklistItem(
  prevState: ChecklistItemState,
  formData: FormData
): Promise<ChecklistItemState> {
  const signalId = formData.get("signalId");
  const title = formData.get("title");
  const note = formData.get("note");

  if (typeof signalId !== "string" || signalId.trim().length === 0) {
    return { success: false, error: "Signal ID is required" };
  }

  if (typeof title !== "string" || title.trim().length === 0) {
    return { success: false, fieldErrors: { title: "Title is required" } };
  }

  const trimmedTitle = title.trim();
  const trimmedNote =
    typeof note === "string" && note.trim().length > 0 ? note.trim() : null;

  await db.$transaction([
    db.signalChecklistItem.create({
      data: {
        signalId,
        title: trimmedTitle,
        note: trimmedNote,
      },
    }),
    db.signalEvent.create({
      data: {
        signalId,
        eventType: "checklist_item_added",
        note: `Checklist item added: ${trimmedTitle}`,
      },
    }),
  ]);

  revalidatePath("/signals");
  return { success: true };
}

export async function toggleChecklistItem(itemId: string): Promise<void> {
  const item = await db.signalChecklistItem.findUnique({
    where: { id: itemId },
  });
  if (!item) return;

  const nowCompleted = !item.isCompleted;

  await db.$transaction([
    db.signalChecklistItem.update({
      where: { id: itemId },
      data: {
        isCompleted: nowCompleted,
        completedAt: nowCompleted ? new Date() : null,
      },
    }),
    db.signalEvent.create({
      data: {
        signalId: item.signalId,
        eventType: nowCompleted
          ? "checklist_item_completed"
          : "checklist_item_uncompleted",
        note: nowCompleted
          ? `Checklist item completed: ${item.title}`
          : `Checklist item uncompleted: ${item.title}`,
      },
    }),
  ]);

  revalidatePath("/signals");
}

export async function deleteChecklistItem(itemId: string): Promise<void> {
  const item = await db.signalChecklistItem.findUnique({
    where: { id: itemId },
  });
  if (!item) return;

  await db.$transaction([
    db.signalChecklistItem.delete({ where: { id: itemId } }),
    db.signalEvent.create({
      data: {
        signalId: item.signalId,
        eventType: "checklist_item_deleted",
        note: `Checklist item deleted: ${item.title}`,
      },
    }),
  ]);

  revalidatePath("/signals");
}

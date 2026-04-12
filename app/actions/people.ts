"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type PersonActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    name?: string;
  };
};

export async function getPeople() {
  return db.person.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createPerson(
  prevState: PersonActionState,
  formData: FormData
): Promise<PersonActionState> {
  const rawName = formData.get("name");
  const rawNotes = formData.get("notes");

  if (typeof rawName !== "string" || rawName.trim().length === 0) {
    return {
      success: false,
      fieldErrors: { name: "Name is required" },
    };
  }

  const name = rawName.trim();
  const notes =
    typeof rawNotes === "string" && rawNotes.trim().length > 0
      ? rawNotes.trim()
      : null;

  // Case-insensitive uniqueness check
  const existing = await db.person.findFirst({
    where: { name: { equals: name, mode: "insensitive" } },
  });
  if (existing) {
    return {
      success: false,
      fieldErrors: { name: "A person with this name already exists" },
    };
  }

  await db.person.create({
    data: { name, notes },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updatePerson(
  prevState: PersonActionState,
  formData: FormData
): Promise<PersonActionState> {
  const id = formData.get("id");
  const rawName = formData.get("name");
  const rawNotes = formData.get("notes");

  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, error: "Person ID is required" };
  }

  if (typeof rawName !== "string" || rawName.trim().length === 0) {
    return {
      success: false,
      fieldErrors: { name: "Name is required" },
    };
  }

  const name = rawName.trim();
  const notes =
    typeof rawNotes === "string" && rawNotes.trim().length > 0
      ? rawNotes.trim()
      : null;

  // Case-insensitive uniqueness check excluding self
  const existing = await db.person.findFirst({
    where: { name: { equals: name, mode: "insensitive" }, NOT: { id } },
  });
  if (existing) {
    return {
      success: false,
      fieldErrors: { name: "A person with this name already exists" },
    };
  }

  await db.person.update({
    where: { id },
    data: { name, notes },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function deletePerson(
  prevState: PersonActionState,
  formData: FormData
): Promise<PersonActionState> {
  const id = formData.get("id");

  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, error: "Person ID is required" };
  }

  const person = await db.person.findUnique({ where: { id } });
  if (!person) {
    return { success: false, error: "Person not found" };
  }

  const assignedCount = await db.signal.count({ where: { ownerId: id } });
  if (assignedCount > 0) {
    return {
      success: false,
      error: `This person is assigned as owner on ${assignedCount} signal${assignedCount !== 1 ? "s" : ""}. Remove them as owner first.`,
    };
  }

  await db.person.delete({ where: { id } });

  revalidatePath("/settings");
  return { success: true };
}

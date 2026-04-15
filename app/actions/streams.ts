"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type StreamActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    key?: string;
    name?: string;
  };
};

export async function getStreams() {
  return db.stream.findMany({
    orderBy: { name: "asc" },
  });
}

export async function createStream(
  prevState: StreamActionState,
  formData: FormData
): Promise<StreamActionState> {
  const rawName = formData.get("name");
  const rawKey = formData.get("key");

  if (typeof rawName !== "string" || rawName.trim().length === 0) {
    return {
      success: false,
      fieldErrors: { name: "Name is required" },
    };
  }

  if (typeof rawKey !== "string" || rawKey.trim().length === 0) {
    return {
      success: false,
      fieldErrors: { key: "Key is required" },
    };
  }

  const name = rawName.trim();
  const key = rawKey.trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
    return {
      success: false,
      fieldErrors: {
        key: "Key must be lowercase letters, numbers, and hyphens (e.g. project-xyz)",
      },
    };
  }

  const existing = await db.stream.findUnique({ where: { key } });
  if (existing) {
    return {
      success: false,
      fieldErrors: { key: "A stream with this key already exists" },
    };
  }

  await db.stream.create({ data: { key, name } });

  revalidatePath("/settings/streams");
  revalidatePath("/signals");
  revalidatePath("/inflight");
  revalidatePath("/");
  return { success: true };
}

export async function updateStream(
  prevState: StreamActionState,
  formData: FormData
): Promise<StreamActionState> {
  const id = formData.get("id");
  const rawName = formData.get("name");
  const rawKey = formData.get("key");

  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, error: "Stream ID is required" };
  }

  if (typeof rawName !== "string" || rawName.trim().length === 0) {
    return {
      success: false,
      fieldErrors: { name: "Name is required" },
    };
  }

  if (typeof rawKey !== "string" || rawKey.trim().length === 0) {
    return {
      success: false,
      fieldErrors: { key: "Key is required" },
    };
  }

  const name = rawName.trim();
  const key = rawKey.trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key)) {
    return {
      success: false,
      fieldErrors: {
        key: "Key must be lowercase letters, numbers, and hyphens (e.g. project-xyz)",
      },
    };
  }

  const existing = await db.stream.findFirst({
    where: { key, NOT: { id } },
  });
  if (existing) {
    return {
      success: false,
      fieldErrors: { key: "A stream with this key already exists" },
    };
  }

  await db.stream.update({
    where: { id },
    data: { key, name },
  });

  revalidatePath("/settings/streams");
  revalidatePath("/signals");
  revalidatePath("/inflight");
  revalidatePath("/");
  return { success: true };
}

export async function deleteStream(
  prevState: StreamActionState,
  formData: FormData
): Promise<StreamActionState> {
  const id = formData.get("id");

  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, error: "Stream ID is required" };
  }

  const stream = await db.stream.findUnique({ where: { id } });
  if (!stream) {
    return { success: false, error: "Stream not found" };
  }

  const assignedCount = await db.signal.count({
    where: { streams: { some: { id } } },
  });
  if (assignedCount > 0) {
    return {
      success: false,
      error: `This stream is assigned to ${assignedCount} signal${assignedCount !== 1 ? "s" : ""}. Remove it from all signals first.`,
    };
  }

  await db.stream.delete({ where: { id } });

  revalidatePath("/settings/streams");
  revalidatePath("/signals");
  revalidatePath("/inflight");
  revalidatePath("/");
  return { success: true };
}

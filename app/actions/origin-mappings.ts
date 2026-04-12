"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";

export type MappingActionState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    matchValue?: string;
    sourceType?: string;
  };
};

export async function getOriginMappings() {
  return db.originMapping.findMany({
    orderBy: { matchValue: "asc" },
  });
}

export async function createOriginMapping(
  prevState: MappingActionState,
  formData: FormData
): Promise<MappingActionState> {
  const rawMatch = formData.get("matchValue");
  const rawType = formData.get("sourceType");
  const rawLabel = formData.get("label");

  if (typeof rawMatch !== "string" || rawMatch.trim().length === 0) {
    return {
      success: false,
      fieldErrors: { matchValue: "Hostname is required" },
    };
  }

  if (typeof rawType !== "string" || rawType.trim().length === 0) {
    return {
      success: false,
      fieldErrors: { sourceType: "Source type is required" },
    };
  }

  const matchValue = rawMatch.trim().toLowerCase();
  const sourceType = rawType.trim().toLowerCase();
  const label =
    typeof rawLabel === "string" && rawLabel.trim().length > 0
      ? rawLabel.trim()
      : null;

  // Validate hostname format (no protocol, no path)
  if (matchValue.includes("/") || matchValue.includes(":")) {
    return {
      success: false,
      fieldErrors: {
        matchValue: "Enter a hostname only (e.g. gitlab.example.com)",
      },
    };
  }

  const existing = await db.originMapping.findUnique({
    where: { matchValue },
  });
  if (existing) {
    return {
      success: false,
      fieldErrors: { matchValue: "A mapping for this hostname already exists" },
    };
  }

  await db.originMapping.create({
    data: { matchValue, sourceType, label },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function updateOriginMapping(
  prevState: MappingActionState,
  formData: FormData
): Promise<MappingActionState> {
  const id = formData.get("id");
  const rawMatch = formData.get("matchValue");
  const rawType = formData.get("sourceType");
  const rawLabel = formData.get("label");

  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, error: "Mapping ID is required" };
  }

  if (typeof rawMatch !== "string" || rawMatch.trim().length === 0) {
    return {
      success: false,
      fieldErrors: { matchValue: "Hostname is required" },
    };
  }

  if (typeof rawType !== "string" || rawType.trim().length === 0) {
    return {
      success: false,
      fieldErrors: { sourceType: "Source type is required" },
    };
  }

  const matchValue = rawMatch.trim().toLowerCase();
  const sourceType = rawType.trim().toLowerCase();
  const label =
    typeof rawLabel === "string" && rawLabel.trim().length > 0
      ? rawLabel.trim()
      : null;

  if (matchValue.includes("/") || matchValue.includes(":")) {
    return {
      success: false,
      fieldErrors: {
        matchValue: "Enter a hostname only (e.g. gitlab.example.com)",
      },
    };
  }

  const existing = await db.originMapping.findUnique({
    where: { matchValue },
  });
  if (existing && existing.id !== id) {
    return {
      success: false,
      fieldErrors: { matchValue: "A mapping for this hostname already exists" },
    };
  }

  await db.originMapping.update({
    where: { id },
    data: { matchValue, sourceType, label },
  });

  revalidatePath("/settings");
  return { success: true };
}

export async function deleteOriginMapping(
  prevState: MappingActionState,
  formData: FormData
): Promise<MappingActionState> {
  const id = formData.get("id");

  if (typeof id !== "string" || id.trim().length === 0) {
    return { success: false, error: "Mapping ID is required" };
  }

  const mapping = await db.originMapping.findUnique({ where: { id } });
  if (!mapping) {
    return { success: false, error: "Mapping not found" };
  }

  await db.originMapping.delete({ where: { id } });

  revalidatePath("/settings");
  return { success: true };
}

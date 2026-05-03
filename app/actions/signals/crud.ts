"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { detectSource } from "@/lib/sources";

export type CreateSignalState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    title?: string;
    sourceUrl?: string;
  };
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

  // --- Optional source URL ---
  const rawSourceUrl = formData.get("sourceUrl");
  const trimmedUrl =
    typeof rawSourceUrl === "string" && rawSourceUrl.trim().length > 0
      ? rawSourceUrl.trim()
      : null;

  if (trimmedUrl) {
    try {
      new URL(trimmedUrl);
    } catch {
      return { success: false, fieldErrors: { sourceUrl: "Invalid URL" } };
    }
  }

  // --- Optional streams ---
  const rawStreamIds = formData.getAll("streamIds");
  const streamIds = rawStreamIds
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());

  const streamConnect =
    streamIds.length > 0
      ? { streams: { connect: streamIds.map((id) => ({ id })) } }
      : {};

  if (trimmedUrl) {
    const { type, label } = await detectSource(trimmedUrl);

    const signal = await db.signal.create({
      data: {
        title: trimmedTitle,
        description: trimmedDescription,
        ...streamConnect,
      },
    });

    await db.signalSource.create({
      data: {
        signalId: signal.id,
        type,
        label,
        url: trimmedUrl,
      },
    });

    await db.signalEvent.create({
      data: {
        signalId: signal.id,
        eventType: "source_added",
        note: `Source added: ${label}`,
      },
    });
  } else {
    await db.signal.create({
      data: {
        title: trimmedTitle,
        description: trimmedDescription,
        ...streamConnect,
      },
    });
  }

  revalidatePath("/");
  revalidatePath("/inflight");
  revalidatePath("/signals");

  return { success: true };
}

export type UpdateSignalState = {
  success: boolean;
  error?: string;
  fieldErrors?: {
    title?: string;
  };
};

export async function updateSignal(
  prevState: UpdateSignalState,
  formData: FormData
): Promise<UpdateSignalState> {
  const signalId = formData.get("signalId");
  const title = formData.get("title");
  const description = formData.get("description");

  if (typeof signalId !== "string" || signalId.trim().length === 0) {
    return { success: false, error: "Signal ID is required" };
  }
  if (typeof title !== "string" || title.trim().length === 0) {
    return { success: false, fieldErrors: { title: "Title is required" } };
  }

  const trimmedTitle = title.trim();
  const trimmedDescription =
    typeof description === "string" && description.trim().length > 0
      ? description.trim()
      : null;

  const rawOwnerId = formData.get("ownerId");
  const ownerId =
    typeof rawOwnerId === "string" && rawOwnerId.trim().length > 0
      ? rawOwnerId.trim()
      : null;

  const existing = await db.signal.findUnique({
    where: { id: signalId },
    include: { streams: { select: { id: true } } },
  });
  if (!existing) {
    return { success: false, error: "Signal not found" };
  }

  // Validate owner exists if provided
  if (ownerId) {
    const person = await db.person.findUnique({ where: { id: ownerId } });
    if (!person) {
      return { success: false, error: "Selected owner not found" };
    }
  }

  // --- Stream changes ---
  const rawStreamIds = formData.getAll("streamIds");
  const newStreamIds = rawStreamIds
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim())
    .sort();
  const existingStreamIds = existing.streams.map((s) => s.id).sort();
  const streamsChanged =
    newStreamIds.length !== existingStreamIds.length ||
    newStreamIds.some((id, i) => id !== existingStreamIds[i]);

  const ownerChanged = (existing.ownerId ?? null) !== ownerId;

  // No-op detection: skip write if nothing changed
  if (
    existing.title === trimmedTitle &&
    (existing.description ?? null) === trimmedDescription &&
    !ownerChanged &&
    !streamsChanged
  ) {
    return { success: true };
  }

  const changes: string[] = [];
  if (existing.title !== trimmedTitle) changes.push("Title updated");
  if ((existing.description ?? null) !== trimmedDescription)
    changes.push("Description updated");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ops: any[] = [
    db.signal.update({
      where: { id: signalId },
      data: {
        title: trimmedTitle,
        description: trimmedDescription,
        ownerId,
        ...(streamsChanged
          ? { streams: { set: newStreamIds.map((id) => ({ id })) } }
          : {}),
      },
    }),
  ];

  if (changes.length > 0) {
    ops.push(
      db.signalEvent.create({
        data: {
          signalId,
          eventType: "edited",
          note: changes.join(", "),
        },
      })
    );
  }

  if (ownerChanged) {
    let ownerNote: string;
    if (ownerId) {
      const person = await db.person.findUnique({ where: { id: ownerId } });
      ownerNote = `Owner set to ${person!.name}`;
    } else {
      ownerNote = "Owner removed";
    }
    ops.push(
      db.signalEvent.create({
        data: {
          signalId,
          eventType: "owner_changed",
          note: ownerNote,
        },
      })
    );
  }

  if (streamsChanged) {
    ops.push(
      db.signalEvent.create({
        data: {
          signalId,
          eventType: "streams_changed",
          note: newStreamIds.length > 0 ? "Streams updated" : "All streams removed",
        },
      })
    );
  }

  await db.$transaction(ops);

  revalidatePath("/");
  revalidatePath("/inflight");
  revalidatePath("/signals");
  revalidatePath("/calendar");

  return { success: true };
}

export async function getSignalWithEvents(signalId: string) {
  const signal = await db.signal.findUnique({
    where: { id: signalId },
    include: {
      owner: true,
      events: { orderBy: { createdAt: "desc" } },
      sources: { orderBy: { createdAt: "desc" } },
      streams: true,
      checklistItems: { orderBy: { createdAt: "asc" } },
    },
  });

  return signal;
}

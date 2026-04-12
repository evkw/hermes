"use client";

import { useActionState, useEffect, useRef } from "react";
import { Label } from "@/components/core/label";
import {
  updateSignalOwner,
  type UpdateOwnerState,
} from "@/app/actions/signals";

const initialState: UpdateOwnerState = { success: false };

export function OwnerSelector({
  signalId,
  currentOwnerId,
  people,
}: {
  signalId: string;
  currentOwnerId: string | null;
  people: { id: string; name: string }[];
}) {
  const [state, formAction, pending] = useActionState(
    updateSignalOwner,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Auto-submit on change
  function handleChange() {
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="signalId" value={signalId} />
      <Label htmlFor="owner-select" className="text-sm text-secondary shrink-0">
        Owner
      </Label>
      <select
        id="owner-select"
        name="ownerId"
        defaultValue={currentOwnerId ?? ""}
        onChange={handleChange}
        disabled={pending}
        className="flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
      >
        <option value="">No owner</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
      {state.error && (
        <p className="text-sm text-destructive" aria-live="polite">
          {state.error}
        </p>
      )}
    </form>
  );
}

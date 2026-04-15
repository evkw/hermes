"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/core/dialog";
import { Button } from "@/components/core/button";
import { Input } from "@/components/core/input";
import { Textarea } from "@/components/core/textarea";
import { Label } from "@/components/core/label";
import { updateSignal, type UpdateSignalState } from "@/app/actions/signals";
import { useSubmitShortcut } from "@/app/hooks/use-submit-shortcut";
import { StreamPicker } from "@/app/components/stream-picker";

const initialState: UpdateSignalState = { success: false };

export function EditSignalDialog({
  signalId,
  signalTitle,
  signalDescription,
  currentOwnerId,
  people,
  streams = [],
  currentStreamIds = [],
  children,
}: {
  signalId: string;
  signalTitle: string;
  signalDescription: string | null;
  currentOwnerId?: string | null;
  people?: { id: string; name: string }[];
  streams?: { id: string; key: string; name: string }[];
  currentStreamIds?: string[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    updateSignal,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  useSubmitShortcut(formRef);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger nativeButton={false} render={<span />}>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Signal</DialogTitle>
          <DialogDescription>
            Update signal details
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          <input type="hidden" name="signalId" value={signalId} />

          <div className="grid gap-2">
            <Label htmlFor="edit-title">Title</Label>
            <Input
              id="edit-title"
              name="title"
              defaultValue={signalTitle}
              required
              autoFocus
            />
            {state.fieldErrors?.title && (
              <p className="text-sm text-destructive" aria-live="polite">
                {state.fieldErrors.title}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="edit-description">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="edit-description"
              name="description"
              defaultValue={signalDescription ?? ""}
              rows={3}
            />
          </div>

          {people && people.length > 0 && (
            <div className="grid gap-2">
              <Label htmlFor="edit-owner">
                Owner{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <select
                id="edit-owner"
                name="ownerId"
                defaultValue={currentOwnerId ?? ""}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">No owner</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <StreamPicker streams={streams} selectedIds={currentStreamIds} />

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import {
  createSignalEvent,
  type CreateEventState,
} from "@/app/actions/signals";
import { useSubmitShortcut } from "@/app/hooks/use-submit-shortcut";

const initialState: CreateEventState = { success: false };

export function NewEventDialog({
  signalId,
  signalTitle,
  children,
}: {
  signalId: string;
  signalTitle: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createSignalEvent,
    initialState
  );
  const formRef = useRef<HTMLFormElement>(null);
  useSubmitShortcut(formRef);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger nativeButton={false} render={<span />}>{children}</DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Event</DialogTitle>
          <DialogDescription>
            Add an update to &ldquo;{signalTitle}&rdquo;
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          <input type="hidden" name="signalId" value={signalId} />

          <div className="grid gap-2">
            <Label htmlFor="note">Note</Label>
            <Textarea
              id="note"
              name="note"
              placeholder="What happened?"
              rows={3}
              required
              autoFocus
            />
            {state.fieldErrors?.note && (
              <p className="text-sm text-destructive" aria-live="polite">
                {state.fieldErrors.note}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="link">
              Link{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="link"
              name="link"
              type="url"
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add Event"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
  createChecklistItem,
  type ChecklistItemState,
} from "@/app/actions/signals";
import { useSubmitShortcut } from "@/app/hooks/use-submit-shortcut";

const initialState: ChecklistItemState = { success: false };

export function AddChecklistItemDialog({
  signalId,
  children,
}: {
  signalId: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createChecklistItem,
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
          <DialogTitle>Add Checklist Item</DialogTitle>
          <DialogDescription>
            Add an action item to track before resolving this signal.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          <input type="hidden" name="signalId" value={signalId} />

          <div className="grid gap-2">
            <Label htmlFor="checklist-title">Title</Label>
            <Input
              id="checklist-title"
              name="title"
              placeholder="Action to complete"
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
            <Label htmlFor="checklist-note">
              Note{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="checklist-note"
              name="note"
              placeholder="Additional context…"
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

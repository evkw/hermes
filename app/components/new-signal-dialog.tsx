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
import { createSignal, type CreateSignalState } from "@/app/actions/signals";
import { useSubmitShortcut } from "@/app/hooks/use-submit-shortcut";

const initialState: CreateSignalState = { success: false };

export function NewSignalDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    createSignal,
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
      <DialogTrigger
        nativeButton={false}
        render={
          <Button
            size="sm"
            className="bg-primary text-on-primary px-6 py-2 rounded-md font-medium text-sm opacity-80 hover:opacity-100"
          />
        }
      >
        New Signal
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Signal</DialogTitle>
          <DialogDescription>
            Create a signal to track something that needs your attention.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="What needs your attention?"
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
            <Label htmlFor="description">
              Description{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Add context or details..."
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="sourceUrl">
              Source URL{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="sourceUrl"
              name="sourceUrl"
              type="url"
              placeholder="https://..."
            />
            {state.fieldErrors?.sourceUrl && (
              <p className="text-sm text-destructive" aria-live="polite">
                {state.fieldErrors.sourceUrl}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating…" : "Create Signal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/core/dialog";
import { Button } from "@/components/core/button";
import { Textarea } from "@/components/core/textarea";
import { Label } from "@/components/core/label";
import { displaceAndFocusSignal, type DisplaceSignalState } from "@/app/actions/signals/signals";
import { useSubmitShortcut } from "@/app/hooks/use-submit-shortcut";

const initialState: DisplaceSignalState = { success: false };

type DisplacementDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newSignalId: string;
  newSignalTitle: string;
  focusedSignals: { id: string; title: string }[];
};

export function DisplacementDialog({
  open,
  onOpenChange,
  newSignalId,
  newSignalTitle,
  focusedSignals,
}: DisplacementDialogProps) {
  const [selected, setSelected] = useState<string>("");
  const [state, formAction, pending] = useActionState(displaceAndFocusSignal, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useSubmitShortcut(formRef);

  useEffect(() => {
    if (state.success) {
      onOpenChange(false);
      setSelected("");
    }
  }, [state, onOpenChange]);

  // Reset selection when dialog opens
  useEffect(() => {
    if (open) {
      setSelected("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Focus is full</DialogTitle>
          <DialogDescription>
            You already have 5 focused signals. Choose one to displace so
            &ldquo;{newSignalTitle}&rdquo; can take focus.
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          <input type="hidden" name="newSignalId" value={newSignalId} />
          <input type="hidden" name="displacedSignalId" value={selected} />

          <fieldset className="grid gap-2">
            <Label>Which signal should lose focus?</Label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {focusedSignals.map((s) => (
                <label
                  key={s.id}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                    selected === s.id
                      ? "border-primary bg-primary/5"
                      : "border-outline-variant/40 hover:border-outline-variant"
                  }`}
                >
                  <input
                    type="radio"
                    name="displacedSignalSelection"
                    value={s.id}
                    checked={selected === s.id}
                    onChange={() => setSelected(s.id)}
                    className="accent-primary"
                  />
                  <span className="text-sm text-on-surface truncate">{s.title}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-2">
            <Label htmlFor="reason">
              Why is this taking priority?
            </Label>
            <Textarea
              id="reason"
              name="reason"
              placeholder="Brief reason for the priority change…"
              rows={2}
              required
            />
          </div>

          {state.error && (
            <p className="text-sm text-destructive" aria-live="polite">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending || !selected}>
              {pending ? "Saving…" : "Displace & Focus"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

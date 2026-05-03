"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/core/dialog";
import { Button } from "@/components/core/button";
import { startFocusSession } from "@/app/actions/signals/focus-sessions";

const DURATION_OPTIONS = [
  { minutes: 15, label: "15 min" },
  { minutes: 30, label: "30 min" },
  { minutes: 60, label: "60 min" },
] as const;

type StartSessionDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signalId: string;
  signalTitle: string;
};

export function StartSessionDialog({
  open,
  onOpenChange,
  signalId,
  signalTitle,
}: StartSessionDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSelect(minutes: number) {
    setError(null);
    startTransition(async () => {
      const result = await startFocusSession(signalId, minutes);
      if (result.success) {
        onOpenChange(false);
      } else {
        setError(result.error ?? "Failed to start session");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Start Focus Session</DialogTitle>
          <DialogDescription>
            Commit to working on &ldquo;{signalTitle}&rdquo; for a fixed block
            of time.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {DURATION_OPTIONS.map((opt) => (
            <Button
              key={opt.minutes}
              variant="outline"
              disabled={pending}
              onClick={() => handleSelect(opt.minutes)}
              className="w-full justify-center"
            >
              {opt.label}
            </Button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-error">{error}</p>
        )}
      </DialogContent>
    </Dialog>
  );
}

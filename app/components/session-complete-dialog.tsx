"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/core/dialog";
import { Button } from "@/components/core/button";
import { resolveSignal } from "@/app/actions/signals/signals";
import { StartSessionDialog } from "./start-session-dialog";

type SessionCompleteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  signalId: string;
  signalTitle: string;
};

export function SessionCompleteDialog({
  open,
  onOpenChange,
  signalId,
  signalTitle,
}: SessionCompleteDialogProps) {
  const router = useRouter();
  const [showStartAnother, setShowStartAnother] = useState(false);
  const [resolvePending, startResolveTransition] = useTransition();

  function handleDone() {
    onOpenChange(false);
  }

  function handleAddNote() {
    onOpenChange(false);
    router.push(`/signals/${signalId}/events`);
  }

  function handleResolve() {
    startResolveTransition(async () => {
      await resolveSignal(signalId);
      onOpenChange(false);
    });
  }

  function handleStartAnother() {
    onOpenChange(false);
    setShowStartAnother(true);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Session complete</DialogTitle>
            <DialogDescription>
              Your focus session on &ldquo;{signalTitle}&rdquo; has ended.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Button variant="outline" onClick={handleStartAnother}>
              Start another session
            </Button>
            <Button variant="outline" onClick={handleAddNote}>
              Add a note
            </Button>
            <Button
              variant="outline"
              onClick={handleResolve}
              disabled={resolvePending}
            >
              {resolvePending ? "Resolving…" : "Mark as resolved"}
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleDone}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StartSessionDialog
        open={showStartAnother}
        onOpenChange={setShowStartAnother}
        signalId={signalId}
        signalTitle={signalTitle}
      />
    </>
  );
}

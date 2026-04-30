"use client";

import { useState } from "react";
import { resolveSignalWithChecklistCheck } from "@/app/actions/signals";
import { Button } from "@/components/core/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/core/dialog";

export function ResolveButton({
  signalId,
  incompleteChecklistCount,
}: {
  signalId: string;
  incompleteChecklistCount: number;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleResolve() {
    setPending(true);
    const result = await resolveSignalWithChecklistCheck(signalId);
    if (!result.resolved && result.needsConfirmation) {
      setShowConfirm(true);
      setPending(false);
      return;
    }
    setPending(false);
  }

  async function handleForceResolve() {
    setPending(true);
    await resolveSignalWithChecklistCheck(signalId, true);
    setShowConfirm(false);
    setPending(false);
  }

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={handleResolve}
      >
        {pending ? "Resolving…" : "Resolve signal"}
      </Button>

      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Incomplete Checklist Items</DialogTitle>
            <DialogDescription>
              There {incompleteChecklistCount === 1 ? "is" : "are"} still{" "}
              <strong>{incompleteChecklistCount}</strong> incomplete checklist{" "}
              {incompleteChecklistCount === 1 ? "item" : "items"}. Resolve
              anyway?
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirm(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={pending}
              onClick={handleForceResolve}
            >
              {pending ? "Resolving…" : "Resolve anyway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

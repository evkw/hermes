"use client";

import { useState } from "react";
import { Button } from "@/components/core/button";
import { StartSessionDialog } from "./start-session-dialog";

type StartSessionButtonProps = {
  signalId: string;
  signalTitle: string;
  hasActiveSession: boolean;
  isInSession: boolean;
};

export function StartSessionButton({
  signalId,
  signalTitle,
  hasActiveSession,
  isInSession,
}: StartSessionButtonProps) {
  const [open, setOpen] = useState(false);

  if (isInSession) {
    return (
      <span className="inline-flex h-8 items-center rounded-md border border-primary/30 bg-primary/5 px-3 text-xs font-medium text-primary">
        In session
      </span>
    );
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={hasActiveSession}
        onClick={() => setOpen(true)}
      >
        Start session
      </Button>
      <StartSessionDialog
        open={open}
        onOpenChange={setOpen}
        signalId={signalId}
        signalTitle={signalTitle}
      />
    </>
  );
}

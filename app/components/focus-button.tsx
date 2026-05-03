"use client";

import { useState, useTransition } from "react";
import { focusSignal, unfocusSignal } from "@/app/actions/signals/signals";
import { DisplacementDialog } from "./displacement-dialog";

type FocusButtonProps = {
  signalId: string;
  signalTitle: string;
  isFocused: boolean;
  variant?: "text" | "button";
};

export function FocusButton({ signalId, signalTitle, isFocused, variant = "text" }: FocusButtonProps) {
  const [pending, startTransition] = useTransition();
  const [displacementOpen, setDisplacementOpen] = useState(false);
  const [focusedSignals, setFocusedSignals] = useState<{ id: string; title: string }[]>([]);

  function handleToggle() {
    if (isFocused) {
      startTransition(() => unfocusSignal(signalId));
      return;
    }

    startTransition(async () => {
      const result = await focusSignal(signalId);
      if (result.needsDisplacement && result.focusedSignals) {
        setFocusedSignals(result.focusedSignals);
        setDisplacementOpen(true);
      }
    });
  }

  const baseClass = variant === "button"
    ? "text-xs font-medium px-3 py-1.5 rounded-md border border-outline-variant/40 hover:border-outline-variant transition-colors"
    : "text-xs font-medium text-on-surface hover:text-on-surface/70 transition-colors";

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={pending}
        className={isFocused
          ? variant === "button"
            ? "text-xs px-3 py-1.5 rounded-md border border-outline-variant/40 text-outline hover:text-secondary hover:border-outline-variant transition-colors"
            : "text-xs text-outline hover:text-secondary transition-colors"
          : baseClass
        }
      >
        {pending ? "…" : isFocused ? "Unfocus" : "Focus"}
      </button>

      <DisplacementDialog
        open={displacementOpen}
        onOpenChange={setDisplacementOpen}
        newSignalId={signalId}
        newSignalTitle={signalTitle}
        focusedSignals={focusedSignals}
      />
    </>
  );
}

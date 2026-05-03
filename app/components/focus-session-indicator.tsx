"use client";

import { useEffect, useState, useTransition, useCallback, useRef } from "react";
import Link from "next/link";
import { endFocusSession, addFocusSessionNote } from "@/app/actions/signals/focus-sessions";
import type { ActiveFocusSession } from "@/app/actions/signals/focus-sessions";
import { SessionCompleteDialog } from "./session-complete-dialog";

type FocusSessionIndicatorProps = {
  session: ActiveFocusSession;
};

function formatRemaining(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0:00";
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function FocusSessionIndicator({ session }: FocusSessionIndicatorProps) {
  const endTimeMs =
    new Date(session.startedAt).getTime() + session.durationMinutes * 60_000;

  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const diff = Math.max(0, Math.ceil((endTimeMs - Date.now()) / 1000));
    return diff;
  });
  const [showComplete, setShowComplete] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [pending, startTransition] = useTransition();
  const [notePending, startNoteTransition] = useTransition();
  const hasAutoEnded = useRef(false);

  const handleEnd = useCallback(() => {
    if (hasAutoEnded.current) return;
    hasAutoEnded.current = true;
    startTransition(async () => {
      await endFocusSession(session.id);
      setShowComplete(true);
    });
  }, [session.id]);

  useEffect(() => {
    // If already expired on mount, end immediately
    if (remainingSeconds <= 0) {
      handleEnd();
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((endTimeMs - Date.now()) / 1000));
      setRemainingSeconds(diff);
      if (diff <= 0) {
        clearInterval(interval);
        handleEnd();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [endTimeMs, remainingSeconds, handleEnd]);

  function handleManualEnd() {
    startTransition(async () => {
      await endFocusSession(session.id);
      setShowComplete(true);
    });
  }

  function handleSubmitNote() {
    if (noteText.trim().length === 0) return;
    startNoteTransition(async () => {
      await addFocusSessionNote(session.id, noteText);
      setNoteText("");
      setShowNote(false);
    });
  }

  return (
    <>
      <div className="w-full border-t border-outline-variant/20 bg-surface-container-low/80 px-6 md:px-12 py-2.5">
        <div className="mx-auto flex max-w-screen-2xl items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="inline-block size-2 shrink-0 animate-pulse rounded-full bg-primary" />
            <span className="text-sm text-on-surface truncate">
              <span className="font-medium">Focusing on:</span>{" "}
              <Link
                href={`/signals/${session.signalId}/events`}
                className="underline decoration-outline-variant/40 hover:decoration-on-surface transition-colors"
              >
                {session.signalTitle}
              </Link>
              <span className="ml-2 text-secondary tabular-nums">
                {formatRemaining(remainingSeconds)} remaining
              </span>
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {showNote ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSubmitNote();
                    }
                    if (e.key === "Escape") {
                      setShowNote(false);
                      setNoteText("");
                    }
                  }}
                  placeholder="Quick note..."
                  disabled={notePending}
                  className="h-7 w-48 rounded-md border border-outline-variant/40 bg-white px-2 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSubmitNote}
                  disabled={notePending || noteText.trim().length === 0}
                  className="text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNote(false);
                    setNoteText("");
                  }}
                  className="text-xs text-outline hover:text-secondary"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowNote(true)}
                className="text-xs font-medium text-secondary hover:text-on-surface transition-colors"
              >
                Add note
              </button>
            )}
            <button
              type="button"
              onClick={handleManualEnd}
              disabled={pending}
              className="text-xs font-medium text-error hover:text-error/80 transition-colors disabled:opacity-50"
            >
              {pending ? "Ending…" : "End session"}
            </button>
          </div>
        </div>
      </div>

      <SessionCompleteDialog
        open={showComplete}
        onOpenChange={setShowComplete}
        signalId={session.signalId}
        signalTitle={session.signalTitle}
      />
    </>
  );
}

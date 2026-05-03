"use client";

import Link from "next/link";
import { useState } from "react";
import { unfocusSignal } from "@/app/actions/signals/signals";
import type { RiskLevel } from "@/app/generated/prisma/enums";
import { EmptySignalSlot } from "./empty-signal-slot";
import { StartSessionDialog } from "@/app/components/start-session-dialog";

type SignalListItem = {
  id: string;
  title: string;
  description: string | null;
  riskLevel: RiskLevel;
  ownerName: string | null;
  streams: { id: string; key: string; name: string }[];
  focusedLabel: string | null;
};

type SignalListProps = {
  signals: SignalListItem[];
  totalSlots: number;
  activeSessionSignalId: string | null;
  hasActiveSession: boolean;
};

function RiskDot({ riskLevel }: { riskLevel: RiskLevel }) {
  if (riskLevel === "active") return <span className="text-secondary">—</span>;

  const color =
    riskLevel === "needs_attention" ? "bg-error" : "bg-amber-500";

  return (
    <span
      className={`inline-block size-2.5 rounded-full ${color}`}
      title={riskLevel}
    />
  );
}

export function SignalList({ signals, totalSlots, activeSessionSignalId, hasActiveSession }: SignalListProps) {
  const occupiedSlots = signals.length;
  const emptySlots = Math.max(totalSlots - occupiedSlots, 0);
  const [sessionSignal, setSessionSignal] = useState<{ id: string; title: string } | null>(null);

  return (
    <>
    <div className="rounded-2xl border border-outline-variant/40 bg-white">
      <div className="flex items-center justify-between border-b border-outline-variant/30 px-5 py-4">
        <h3 className="text-xs font-medium uppercase tracking-wider text-outline">
          Focus - {occupiedSlots}/{totalSlots}
        </h3>
        <span className="text-xs text-secondary">
          {occupiedSlots === 1 ? "1 signal" : `${occupiedSlots} signals`}
        </span>
      </div>

      <ul className="divide-y divide-outline-variant/30">
        {signals.map((signal) => {
          const isInSession = activeSessionSignalId === signal.id;
          return (
          <li
            key={signal.id}
            className={`group flex flex-col gap-3 px-5 py-4 transition-colors sm:flex-row sm:items-start sm:justify-between ${
              isInSession
                ? "bg-primary/5 border-l-2 border-l-primary"
                : "hover:bg-surface-container-low/60 focus-within:bg-surface-container-low/60"
            }`}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <RiskDot riskLevel={signal.riskLevel} />
                <Link href={`/signals/${signal.id}/events`} className="min-w-0">
                  <h4 className="truncate text-sm font-medium text-on-surface">
                    {signal.title}
                  </h4>
                </Link>
              </div>

              {signal.description && (
                <p className="mt-1 max-w-2xl truncate text-sm text-secondary">
                  {signal.description}
                </p>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-outline">
                {signal.focusedLabel && (
                  <span>Focused {signal.focusedLabel}</span>
                )}
              </div>

              {signal.streams.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {signal.streams.map((stream) => (
                    <span
                      key={stream.id}
                      className="inline-flex items-center rounded-md border border-outline-variant/30 bg-outline-variant/10 px-2 py-0.5 text-[10px] font-medium text-secondary"
                    >
                      {stream.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 sm:self-center">
              {isInSession ? (
                <span className="text-xs font-medium text-primary">In session</span>
              ) : (
                <button
                  type="button"
                  disabled={hasActiveSession}
                  onClick={() => setSessionSignal({ id: signal.id, title: signal.title })}
                  className="text-xs font-medium text-secondary opacity-0 transition-opacity hover:text-on-surface group-hover:opacity-100 group-focus-within:opacity-100 disabled:opacity-0"
                >
                  Start session
                </button>
              )}
              <form action={unfocusSignal.bind(null, signal.id)}>
                <button
                  type="submit"
                  className="text-xs font-medium text-outline opacity-0 transition-opacity hover:text-secondary group-hover:opacity-100 group-focus-within:opacity-100"
                >
                  Unfocus
                </button>
              </form>
            </div>
          </li>
          );
        })}
        {Array.from({ length: emptySlots }, (_, index) => {
          const slotNumber = occupiedSlots + index + 1;

          return (
            <li key={`empty-slot-${slotNumber}`} className="px-5 py-4">
              <EmptySignalSlot slotNumber={slotNumber} totalSlots={totalSlots} />
            </li>
          );
        })}
      </ul>
    </div>

    {sessionSignal && (
      <StartSessionDialog
        open={!!sessionSignal}
        onOpenChange={(open) => { if (!open) setSessionSignal(null); }}
        signalId={sessionSignal.id}
        signalTitle={sessionSignal.title}
      />
    )}
    </>
  );
}

"use client";

import { toggleFocusToday, resolveSignal } from "@/app/actions/signals";
import type { RiskLevel } from "@/app/generated/prisma/enums";

type SignalListItem = {
  id: string;
  title: string;
  riskLevel: RiskLevel;
  lastWorkedLabel: string | null;
};

function RiskDot({ riskLevel }: { riskLevel: RiskLevel }) {
  if (riskLevel === "active") return null;
  const color =
    riskLevel === "needs_attention"
      ? "bg-error"
      : "bg-amber-500";
  return <span className={`inline-block size-2 rounded-full ${color} shrink-0`} aria-label={riskLevel === "needs_attention" ? "Needs attention" : "At risk"} />;
}

export function SignalList({ signals }: { signals: SignalListItem[] }) {
  if (signals.length === 0) {
    return (
      <p className="text-sm text-outline py-6">
        No other active signals
      </p>
    );
  }

  return (
    <ul className="divide-y divide-outline-variant/40">
      {signals.map((signal) => (
        <li key={signal.id} className="py-3.5 flex items-center gap-3">
          <div className="w-2 flex justify-center shrink-0">
            <RiskDot riskLevel={signal.riskLevel} />
          </div>

          <a href="#" className="flex-1 min-w-0">
            <span className="text-sm font-medium text-on-surface leading-snug truncate block">
              {signal.title}
            </span>
            {signal.lastWorkedLabel && (
              <span className="text-xs text-outline">{signal.lastWorkedLabel}</span>
            )}
          </a>

          <div className="flex items-center gap-3 shrink-0">
            <form action={toggleFocusToday.bind(null, signal.id)}>
              <button
                type="submit"
                className="text-xs font-medium text-on-surface hover:text-on-surface/70 transition-colors"
              >
                Focus today
              </button>
            </form>
            <form action={resolveSignal.bind(null, signal.id)}>
              <button
                type="submit"
                className="text-xs text-outline hover:text-secondary transition-colors"
              >
                Resolve
              </button>
            </form>
          </div>
        </li>
      ))}
    </ul>
  );
}

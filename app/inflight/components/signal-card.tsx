"use client";

import { toggleFocusToday, markWorkedToday, resolveSignal } from "@/app/actions/signals";
import type { RiskLevel } from "@/app/generated/prisma/enums";

type SignalCardProps = {
  id: string;
  title: string;
  description: string | null;
  riskLevel: RiskLevel;
  lastWorkedLabel: string | null;
  isFocusedToday: boolean;
};

function RiskDot({ riskLevel }: { riskLevel: RiskLevel }) {
  if (riskLevel === "active") return null;
  const color =
    riskLevel === "needs_attention"
      ? "bg-error"
      : "bg-amber-500";
  return <span className={`inline-block size-2 rounded-full ${color} shrink-0`} aria-label={riskLevel === "needs_attention" ? "Needs attention" : "At risk"} />;
}

export function SignalCard({
  id,
  title,
  description,
  riskLevel,
  lastWorkedLabel,
  isFocusedToday,
}: SignalCardProps) {
  return (
    <div className="py-5 group">
      <div className="flex items-start gap-3">
        <div className="pt-1.5">
          <RiskDot riskLevel={riskLevel} />
          {riskLevel === "active" && <span className="inline-block size-2" />}
        </div>

        <div className="flex-1 min-w-0">
          <a href="#" className="block">
            <h3 className="text-base font-medium text-on-surface leading-snug">
              {title}
            </h3>
          </a>

          {description && (
            <p className="mt-1 text-sm text-secondary line-clamp-2 leading-relaxed">
              {description}
            </p>
          )}

          {lastWorkedLabel && (
            <p className="mt-1.5 text-xs text-outline">
              {lastWorkedLabel}
            </p>
          )}

          {/* Actions */}
          <div className="mt-3 flex items-center gap-4">
            {isFocusedToday ? (
              <>
                <form action={markWorkedToday.bind(null, id)}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-on-surface hover:text-on-surface/70 transition-colors"
                  >
                    Mark worked today
                  </button>
                </form>
                <form action={toggleFocusToday.bind(null, id)}>
                  <button
                    type="submit"
                    className="text-xs text-outline hover:text-secondary transition-colors"
                  >
                    Remove focus
                  </button>
                </form>
                <form action={resolveSignal.bind(null, id)}>
                  <button
                    type="submit"
                    className="text-xs text-outline hover:text-secondary transition-colors"
                  >
                    Resolve
                  </button>
                </form>
              </>
            ) : (
              <>
                <form action={toggleFocusToday.bind(null, id)}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-on-surface hover:text-on-surface/70 transition-colors"
                  >
                    Focus today
                  </button>
                </form>
                <form action={resolveSignal.bind(null, id)}>
                  <button
                    type="submit"
                    className="text-xs text-outline hover:text-secondary transition-colors"
                  >
                    Resolve
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

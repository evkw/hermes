"use client";

import Link from "next/link";
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
    <div className="group flex flex-col justify-between rounded-xl border border-outline-variant/40 p-5 transition-colors hover:border-outline-variant">
      <div>
        <div className="flex items-center gap-2">
          <RiskDot riskLevel={riskLevel} />
          <Link href={`/signals/${id}/events`} className="block min-w-0">
            <h3 className="text-sm font-medium text-on-surface leading-snug truncate">
              {title}
            </h3>
          </Link>
        </div>

        {description && (
          <p className="mt-2 text-sm text-secondary line-clamp-2 leading-relaxed">
            {description}
          </p>
        )}

        {lastWorkedLabel && (
          <p className="mt-2 text-xs text-outline">
            {lastWorkedLabel}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="mt-4 flex items-center gap-3 border-t border-outline-variant/30 pt-3">
        {isFocusedToday ? (
          <>
            <form action={markWorkedToday.bind(null, id)}>
              <button
                type="submit"
                className="text-xs font-medium text-on-surface hover:text-on-surface/70 transition-colors"
              >
                Mark worked
              </button>
            </form>
            <form action={toggleFocusToday.bind(null, id)}>
              <button
                type="submit"
                className="text-xs text-outline hover:text-secondary transition-colors"
              >
                Unfocus
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
                className="text-xs font-medium text-on-surface hover:text-on-surface/70 transition-colors"
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
  );
}

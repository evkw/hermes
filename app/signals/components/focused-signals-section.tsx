"use client";

import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { FocusButton } from "@/app/components/focus-button";

const MAX_FOCUSED_SIGNALS = 5;

type FocusedSignal = {
  id: string;
  title: string;
  description: string | null;
  riskLevel: string;
  ownerName: string | null;
  streams: { id: string; key: string; name: string }[];
};

function RiskDot({ riskLevel }: { riskLevel: string }) {
  if (riskLevel === "active") return null;
  const color =
    riskLevel === "needs_attention" ? "bg-error" : "bg-amber-500";
  return (
    <span
      className={`inline-block size-2 rounded-full ${color} shrink-0`}
      aria-label={riskLevel}
    />
  );
}

export function FocusedSignalsSection({ signals }: { signals: FocusedSignal[] }) {
  return (
    <SectionCard
      title={`Focus — ${signals.length}/${MAX_FOCUSED_SIGNALS}`}
      className="mb-6"
    >
      <ul className="divide-y divide-outline-variant/40">
        {signals.map((signal) => (
          <li key={signal.id} className="group py-3 flex items-center gap-3">
            <div className="w-2 flex justify-center shrink-0">
              <RiskDot riskLevel={signal.riskLevel} />
            </div>

            <Link href={`/signals/${signal.id}/events`} className="flex-1 min-w-0">
              <span className="text-sm font-medium text-on-surface leading-snug truncate block">
                {signal.title}
              </span>
              {signal.description && (
                <span className="text-xs text-secondary truncate block mt-0.5">
                  {signal.description}
                </span>
              )}
              <div className="flex items-center gap-2 mt-0.5">
                {signal.ownerName && (
                  <span className="text-xs text-outline">{signal.ownerName}</span>
                )}
                {signal.streams.length > 0 && (
                  <div className="flex gap-1">
                    {signal.streams.map((s) => (
                      <span
                        key={s.id}
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/10 text-primary"
                      >
                        {s.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>

            <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <FocusButton
                signalId={signal.id}
                signalTitle={signal.title}
                isFocused={true}
              />
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

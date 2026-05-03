import { db } from "@/lib/db";
import { SectionCard } from "@/components/ui/section-card";
import { EmptyFocus } from "./components/empty-focus";
import { SignalList } from "./components/signal-list";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatFocusedOnDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function SignalsPage() {
  const activeSignals = await db.signal.findMany({
    where: { status: "active" },
    include: { owner: true, streams: true },
    orderBy: { createdAt: "desc" },
  });

  const focusedSignals = activeSignals
    .filter((s) => s.isFocused)
    .sort((a, b) => {
      const left = a.focusedAt?.getTime() ?? Number.POSITIVE_INFINITY;
      const right = b.focusedAt?.getTime() ?? Number.POSITIVE_INFINITY;
      if (left !== right) return left - right;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  const MAX_DISPLAY = 5;
  const visibleFocused = focusedSignals.slice(0, MAX_DISPLAY);

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
          My Focus
        </h1>
        <p className="mt-1 text-sm text-secondary">{formatDate(new Date())}</p>
      </div>

      {/* Focused Signals */}
      <SectionCard
        title="Current Focus"
        className="mb-12"
        actions={
          <div className="flex items-center gap-4">
            <span className="text-xs font-medium uppercase tracking-wider text-outline">
              {visibleFocused.length}/{MAX_DISPLAY}
            </span>
            {focusedSignals.length > MAX_DISPLAY ? (
              <Link
                href="/signals"
                className="text-sm font-medium text-secondary transition-colors hover:text-on-surface"
              >
                {focusedSignals.length - MAX_DISPLAY} more focused signals &rarr;
              </Link>
            ) : null}
          </div>
        }
      >
        {visibleFocused.length === 0 ? (
          <EmptyFocus />
        ) : (
          <SignalList
            totalSlots={MAX_DISPLAY}
            signals={visibleFocused.map((signal) => ({
              id: signal.id,
              title: signal.title,
              description: signal.description,
              riskLevel: signal.riskLevel,
              ownerName: signal.owner?.name ?? null,
              focusedLabel: formatFocusedOnDate(
                signal.focusedOnDate ?? signal.focusedAt ?? null
              ),
              streams: signal.streams.map((s) => ({
                id: s.id,
                key: s.key,
                name: s.name,
              })),
            }))}
          />
        )}
      </SectionCard>

    </div>
  );
}

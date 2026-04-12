import { db } from "@/lib/db";
import { SignalCard } from "./components/signal-card";
import { EmptyFocus } from "./components/empty-focus";
import type { RiskLevel } from "@/app/generated/prisma/enums";
import Link from "next/link";

export const dynamic = "force-dynamic";
import { SignalList } from "./components/signal-list";
import { SectionCard } from "@/components/ui/section-card";

function startOfTodayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

function endOfTodayUTC(): Date {
  const start = startOfTodayUTC();
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

const RISK_ORDER: Record<RiskLevel, number> = {
  needs_attention: 0,
  at_risk: 1,
  active: 2,
};

function sortByRiskThenDate<T extends { riskLevel: RiskLevel; createdAt: Date }>(
  signals: T[]
): T[] {
  return signals.sort((a, b) => {
    const riskDiff = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
    if (riskDiff !== 0) return riskDiff;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });
}

function relativeWorkedLabel(lastWorkedAt: Date | null): string | null {
  if (!lastWorkedAt) return null;
  const now = new Date();
  const diffMs = now.getTime() - lastWorkedAt.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Worked today";
  if (diffDays === 1) return "Worked yesterday";
  return `Worked ${diffDays} days ago`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export default async function SignalsPage() {
  const today = startOfTodayUTC();
  const todayEnd = endOfTodayUTC();

  const activeSignals = await db.signal.findMany({
    where: { status: "active" },
    include: { owner: true },
    orderBy: { createdAt: "desc" },
  });

  const focusedToday = sortByRiskThenDate(
    activeSignals.filter(
      (s) =>
        s.focusedOnDate &&
        s.focusedOnDate.getTime() >= today.getTime() &&
        s.focusedOnDate.getTime() <= todayEnd.getTime()
    )
  );
  const MAX_DISPLAY = 6;
  const visibleFocused = focusedToday.slice(0, MAX_DISPLAY);
  const everythingElse = activeSignals
    .filter(
      (s) =>
        !s.focusedOnDate ||
        s.focusedOnDate.getTime() < today.getTime() ||
        s.focusedOnDate.getTime() > todayEnd.getTime()
    )
    .sort((a, b) => {
      const riskDiff = RISK_ORDER[a.riskLevel] - RISK_ORDER[b.riskLevel];
      if (riskDiff !== 0) return riskDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    })
    .slice(0, MAX_DISPLAY);



  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
          In Flight
        </h1>
        <p className="mt-1 text-sm text-secondary">{formatDate(new Date())}</p>
      </div>

      {/* Focused Today */}
      <SectionCard
        title="Today's Focus"
        className="mb-12"
        actions={
          focusedToday.length > MAX_DISPLAY ? (
            <Link
              href="/signals"
              className="text-sm font-medium text-secondary hover:text-on-surface transition-colors"
            >
              {focusedToday.length - MAX_DISPLAY} &nbsp; more focused signals &rarr;
            </Link>
          ) : undefined
        }
      >
        {visibleFocused.length === 0 ? (
          <EmptyFocus />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleFocused.map((signal) => (
              <SignalCard
                key={signal.id}
                id={signal.id}
                title={signal.title}
                description={signal.description}
                riskLevel={signal.riskLevel}
                lastWorkedLabel={relativeWorkedLabel(signal.lastWorkedAt)}
                ownerName={signal.owner?.name ?? null}
                isFocusedToday={true}
              />
            ))}
          </div>
        )}
      </SectionCard>

      {/* Some unfocused */}
      <SectionCard title="Suggested Signals to focus">
        <SignalList
          signals={everythingElse.map((signal) => ({
            id: signal.id,
            title: signal.title,
            riskLevel: signal.riskLevel,
            lastWorkedLabel: relativeWorkedLabel(signal.lastWorkedAt),
          }))}
        />
      </SectionCard>
    </div>
  );
}

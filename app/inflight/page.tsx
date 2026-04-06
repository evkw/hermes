import { db } from "@/lib/db";
import { SignalCard } from "./components/signal-card";
import { SignalList } from "./components/signal-list";
import type { RiskLevel } from "@/app/generated/prisma/enums";

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

  const everythingElse = sortByRiskThenDate(
    activeSignals.filter(
      (s) =>
        !s.focusedOnDate ||
        s.focusedOnDate.getTime() < today.getTime() ||
        s.focusedOnDate.getTime() > todayEnd.getTime()
    )
  );

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
      <section className="mb-12">
        <h2 className="text-xs font-medium uppercase tracking-wider text-outline mb-4">
          Focused Today
        </h2>

        {focusedToday.length === 0 ? (
          <p className="text-sm text-outline py-6">
            No signals focused for today
          </p>
        ) : (
          <div className="divide-y divide-outline-variant/40">
            {focusedToday.map((signal) => (
              <SignalCard
                key={signal.id}
                id={signal.id}
                title={signal.title}
                description={signal.description}
                riskLevel={signal.riskLevel}
                lastWorkedLabel={relativeWorkedLabel(signal.lastWorkedAt)}
                isFocusedToday={true}
              />
            ))}
          </div>
        )}
      </section>

      {/* Everything Else */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-wider text-outline mb-4">
          Everything Else
        </h2>

        <SignalList
          signals={everythingElse.map((signal) => ({
            id: signal.id,
            title: signal.title,
            riskLevel: signal.riskLevel,
            lastWorkedLabel: relativeWorkedLabel(signal.lastWorkedAt),
          }))}
        />
      </section>
    </div>
  );
}

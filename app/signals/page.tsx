import { db } from "@/lib/db";
import { SignalsDataTable } from "./components/signals-data-table";

export default async function SignalsTablePage() {
  const signals = await db.signal.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { events: true } } },
  });

  const rows = signals.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    status: s.status,
    riskLevel: s.riskLevel,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    lastWorkedAt: s.lastWorkedAt?.toISOString() ?? null,
    resolvedAt: s.resolvedAt?.toISOString() ?? null,
    focusedOnDate: s.focusedOnDate?.toISOString() ?? null,
    eventCount: s._count.events,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
          All Signals
        </h1>
        <p className="mt-1 text-sm text-secondary">
          {signals.length} signal{signals.length !== 1 ? "s" : ""} total
        </p>
      </div>

      <SignalsDataTable data={rows} />
    </div>
  );
}

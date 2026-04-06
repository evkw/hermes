import { db } from "@/lib/db";
import { RetroView } from "./components/retro-view";

export default async function RetroPage() {
  const signals = await db.signal.findMany({
    where: { status: "active" },
    orderBy: { createdAt: "asc" },
    include: {
      events: {
        orderBy: { createdAt: "desc" },
        take: 3,
      },
    },
  });

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface mb-2">
          No active signals
        </h1>
        <p className="text-sm text-secondary">
          Nothing to review right now.
        </p>
      </div>
    );
  }

  const serialized = signals.map((s) => ({
    id: s.id,
    title: s.title,
    description: s.description,
    riskLevel: s.riskLevel,
    events: s.events.map((e) => ({
      id: e.id,
      eventType: e.eventType,
      note: e.note,
      createdAt: e.createdAt.toISOString(),
    })),
  }));

  return <RetroView signals={serialized} />;
}

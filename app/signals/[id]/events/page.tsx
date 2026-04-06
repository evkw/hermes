import { notFound } from "next/navigation";
import { getSignalWithEvents } from "@/app/actions/signals";
import { SectionCard } from "@/components/ui/section-card";
import { EventsDataTable } from "./components/events-data-table";

export default async function SignalEventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const signal = await getSignalWithEvents(id);

  if (!signal) {
    notFound();
  }

  const rows = signal.events.map((e) => ({
    id: e.id,
    eventType: e.eventType,
    note: e.note,
    link: e.link,
    createdAt: e.createdAt.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <SectionCard>
        <h1 className="text-4xl font-bold tracking-tight text-on-surface">
          {signal.title}
        </h1>
        {signal.description && (
          <p className="mt-2 text-sm text-secondary">
            {signal.description}
          </p>
        )}
      </SectionCard>

      <SectionCard title={`All Events — ${signal.events.length} event${signal.events.length !== 1 ? "s" : ""}`}>
        <EventsDataTable data={rows} />
      </SectionCard>
    </div>
  );
}

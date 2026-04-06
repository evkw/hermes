import { notFound } from "next/navigation";
import { getSignalWithEvents } from "@/app/actions/signals";
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
    <div>
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-on-surface truncate max-w-3xl">
          {signal.title}
        </h1>
        {signal.description && (
          <p className="mt-2 text-sm text-secondary truncate max-w-3xl">
            {signal.description}
          </p>
        )}
      </div>

      <div className="mb-4">
        <h2 className="text-lg font-semibold text-on-surface">
          All Events
        </h2>
        <p className="mt-1 text-sm text-secondary">
          {signal.events.length} event{signal.events.length !== 1 ? "s" : ""}{" "}
          total
        </p>
      </div>

      <EventsDataTable data={rows} />
    </div>
  );
}

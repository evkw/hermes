import { notFound } from "next/navigation";
import { getSignalWithEvents } from "@/app/actions/signals";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/core/button";
import { EventsDataTable } from "./components/events-data-table";
import { SourcesDataTable } from "./components/sources-data-table";
import { SourceFormDialog } from "./components/source-form-dialog";

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

      <SectionCard
        title={`Sources — ${signal.sources.length}`}
        actions={
          <SourceFormDialog signalId={signal.id} mode="add">
            <Button size="sm" variant="outline">
              Add source
            </Button>
          </SourceFormDialog>
        }
      >
        <SourcesDataTable
          data={signal.sources.map((s) => ({
            id: s.id,
            signalId: signal.id,
            type: s.type,
            label: s.label,
            url: s.url,
            note: s.note,
            createdAt: s.createdAt.toISOString(),
          }))}
        />
      </SectionCard>

      <SectionCard title={`All Events — ${signal.events.length} event${signal.events.length !== 1 ? "s" : ""}`}>
        <EventsDataTable data={rows} />
      </SectionCard>
    </div>
  );
}

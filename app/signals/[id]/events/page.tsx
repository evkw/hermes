import { notFound } from "next/navigation";
import { getSignalWithEvents, unresolveSignal } from "@/app/actions/signals";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/core/button";
import { EventsDataTable } from "./components/events-data-table";
import { SourcesDataTable } from "./components/sources-data-table";
import { SourceFormDialog } from "./components/source-form-dialog";
import { EditSignalDialog } from "@/app/components/edit-signal-dialog";
import { NewEventDialog } from "@/app/components/new-event-dialog";

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
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-4xl font-bold tracking-tight text-on-surface">
              {signal.title}
            </h1>
            {signal.description && (
              <p className="mt-2 text-sm text-secondary">
                {signal.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <EditSignalDialog
              signalId={signal.id}
              signalTitle={signal.title}
              signalDescription={signal.description}
            >
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </EditSignalDialog>
            {signal.status === "resolved" && (
              <form action={unresolveSignal.bind(null, signal.id)}>
                <Button type="submit" size="sm" variant="outline">
                  Reopen signal
                </Button>
              </form>
            )}
          </div>
        </div>
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

      <SectionCard
        title={`All Events — ${signal.events.length} event${signal.events.length !== 1 ? "s" : ""}`}
        actions={
          <NewEventDialog signalId={signal.id} signalTitle={signal.title}>
            <Button size="sm" variant="outline">
              Add event
            </Button>
          </NewEventDialog>
        }
      >
        <EventsDataTable data={rows} />
      </SectionCard>
    </div>
  );
}

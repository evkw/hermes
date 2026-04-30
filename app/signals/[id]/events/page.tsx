import { notFound } from "next/navigation";
import { getSignalWithEvents, unresolveSignal } from "@/app/actions/signals";
import { getOriginMappings } from "@/app/actions/origin-mappings";
import { getStreams } from "@/app/actions/streams";
import { SectionCard } from "@/components/ui/section-card";
import { Button } from "@/components/core/button";
import { EventsDataTable } from "./components/events-data-table";
import { SourcesDataTable } from "./components/sources-data-table";
import { SourceFormDialog } from "./components/source-form-dialog";
import { EditSignalDialog } from "@/app/components/edit-signal-dialog";
import { NewEventDialog } from "@/app/components/new-event-dialog";
import { getPeople } from "@/app/actions/people";
import { ChecklistSection } from "./components/checklist-section";
import { AddChecklistItemDialog } from "./components/add-checklist-item-dialog";
import { ResolveButton } from "./components/resolve-button";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function SignalEventsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [signal, mappings, people, allStreams] = await Promise.all([
    getSignalWithEvents(id),
    getOriginMappings(),
    getPeople(),
    getStreams(),
  ]);

  if (!signal) {
    notFound();
  }

  const sourceTypeOptions = mappings.map((m) => ({
    value: m.sourceType,
    label: m.label ?? capitalize(m.sourceType),
  }));

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
            {signal.owner && (
              <p className="mt-2 text-xs text-outline">
                Owner: {signal.owner.name}
              </p>
            )}
            {signal.streams && signal.streams.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {signal.streams.map((stream) => (
                  <span
                    key={stream.id}
                    className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary"
                  >
                    {stream.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <EditSignalDialog
              signalId={signal.id}
              signalTitle={signal.title}
              signalDescription={signal.description}
              currentOwnerId={signal.ownerId}
              people={people.map((p) => ({ id: p.id, name: p.name }))}
              streams={allStreams.map((s) => ({ id: s.id, key: s.key, name: s.name }))}
              currentStreamIds={signal.streams?.map((s) => s.id) ?? []}
            >
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </EditSignalDialog>
            {signal.status === "active" && (
              <ResolveButton
                signalId={signal.id}
                incompleteChecklistCount={
                  signal.checklistItems.filter((i) => !i.isCompleted).length
                }
              />
            )}
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
          <SourceFormDialog signalId={signal.id} mode="add" sourceTypeOptions={sourceTypeOptions}>
            <Button size="sm" variant="outline">
              Add source
            </Button>
          </SourceFormDialog>
        }
      >
        <SourcesDataTable
          sourceTypeOptions={sourceTypeOptions}
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

      <section className="rounded-2xl bg-white shadow-[0_1px_3px_rgba(0,0,0,0.12),0_1px_2px_rgba(0,0,0,0.06)] p-6">
        <ChecklistSection
          items={signal.checklistItems.map((i) => ({
            id: i.id,
            title: i.title,
            isCompleted: i.isCompleted,
            completedAt: i.completedAt?.toISOString() ?? null,
            note: i.note,
          }))}
          addButton={
            <AddChecklistItemDialog signalId={signal.id}>
              <Button size="sm" variant="outline">
                Add item
              </Button>
            </AddChecklistItemDialog>
          }
        />
      </section>
    </div>
  );
}

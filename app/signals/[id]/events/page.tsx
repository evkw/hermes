import { notFound } from "next/navigation";
import { getSignalWithEvents } from "@/app/actions/signals";
import { SectionCard } from "@/components/ui/section-card";
import { EventsDataTable } from "./components/events-data-table";

const SOURCE_TYPE_LABELS: Record<string, string> = {
  manual: "Manual",
  teams: "Teams",
  gitlab: "GitLab",
  jira: "Jira",
  url_other: "URL / Other",
};

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

      {signal.sources.length > 0 && (
        <SectionCard title={`Sources — ${signal.sources.length}`}>
          <div className="divide-y divide-outline-variant/40">
            {signal.sources.map((source) => (
              <div key={source.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-md bg-outline-variant/20 px-2 py-0.5 text-xs font-medium text-secondary">
                    {SOURCE_TYPE_LABELS[source.type] ?? source.type}
                  </span>
                  <span className="text-sm font-medium text-on-surface">
                    {source.label}
                  </span>
                </div>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-blue-600 hover:underline truncate"
                  >
                    {source.url}
                  </a>
                )}
                {source.note && (
                  <p className="mt-1 text-sm text-secondary">{source.note}</p>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title={`All Events — ${signal.events.length} event${signal.events.length !== 1 ? "s" : ""}`}>
        <EventsDataTable data={rows} />
      </SectionCard>
    </div>
  );
}

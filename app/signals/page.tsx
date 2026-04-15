import { db } from "@/lib/db";
import { SectionCard } from "@/components/ui/section-card";
import { SignalsDataTable } from "./components/signals-data-table";
import { getStreams } from "@/app/actions/streams";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

const SORTABLE_COLUMNS = new Set([
  "riskLevel",
  "title",
  "status",
  "focusedOnDate",
  "lastWorkedAt",
  "createdAt",
  "eventCount",
  "owner",
]);

function buildOrderBy(sort: string, order: "asc" | "desc") {
  if (sort === "eventCount") {
    return { events: { _count: order } };
  }
  if (sort === "owner") {
    return { owner: { name: order } };
  }
  return { [sort]: order };
}

export default async function SignalsTablePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const pageParam = typeof params.page === "string" ? parseInt(params.page, 10) : 1;
  const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;

  const sortParam = typeof params.sort === "string" ? params.sort : "createdAt";
  const orderParam = typeof params.order === "string" ? params.order : "desc";
  const sort = SORTABLE_COLUMNS.has(sortParam) ? sortParam : "createdAt";
  const order: "asc" | "desc" = orderParam === "asc" ? "asc" : "desc";

  const q = typeof params.q === "string" ? params.q.trim() : "";
  const showResolved = params.resolved === "1";

  const streamFilter = typeof params.streams === "string" && params.streams.trim().length > 0
    ? params.streams.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const statusFilter = showResolved ? {} : { status: "active" as const };
  const searchFilter = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const where = {
    ...statusFilter,
    ...searchFilter,
    ...(streamFilter.length > 0
      ? { streams: { some: { key: { in: streamFilter } } } }
      : {}),
  };

  const [signals, filteredCount, totalCount, allStreams] = await Promise.all([
    db.signal.findMany({
      where,
      orderBy: buildOrderBy(sort, order),
      include: { owner: true, streams: true, _count: { select: { events: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.signal.count({ where }),
    db.signal.count(),
    getStreams(),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCount / PAGE_SIZE));

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
    ownerName: s.owner?.name ?? null,
    streams: s.streams.map((st) => ({ id: st.id, key: st.key, name: st.name })),
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
          All Signals
        </h1>
        <p className="mt-1 text-sm text-secondary">
          {q
            ? `${filteredCount} of ${totalCount} signal${totalCount !== 1 ? "s" : ""}`
            : showResolved
              ? `${totalCount} signal${totalCount !== 1 ? "s" : ""} total`
              : `${filteredCount} active signal${filteredCount !== 1 ? "s" : ""}`}
        </p>
      </div>

      <SectionCard>
        <SignalsDataTable
          data={rows}
          page={page}
          totalPages={totalPages}
          sort={sort}
          order={order}
          q={q}
          showResolved={showResolved}
          streams={allStreams.map((s) => ({ id: s.id, key: s.key, name: s.name }))}
          activeStreams={streamFilter}
        />
      </SectionCard>
    </div>
  );
}

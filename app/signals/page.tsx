import { db } from "@/lib/db";
import { SectionCard } from "@/components/ui/section-card";
import { SignalsDataTable } from "./components/signals-data-table";

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
]);

function buildOrderBy(sort: string, order: "asc" | "desc") {
  if (sort === "eventCount") {
    return { events: { _count: order } };
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

  const where = q
    ? {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [signals, filteredCount, totalCount] = await Promise.all([
    db.signal.findMany({
      where,
      orderBy: buildOrderBy(sort, order),
      include: { _count: { select: { events: true } } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    db.signal.count({ where }),
    db.signal.count(),
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
            : `${totalCount} signal${totalCount !== 1 ? "s" : ""} total`}
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
        />
      </SectionCard>
    </div>
  );
}

"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useEffect, useCallback, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/table";
import { Input } from "@/components/core/input";
import { Button } from "@/components/core/button";

type SignalRow = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  riskLevel: string;
  createdAt: string;
  updatedAt: string;
  lastWorkedAt: string | null;
  resolvedAt: string | null;
  focusedOnDate: string | null;
  eventCount: number;
  ownerName: string | null;
};

function RiskDot({ riskLevel }: { riskLevel: string }) {
  if (riskLevel === "active") return <span className="text-secondary">—</span>;
  const color =
    riskLevel === "needs_attention" ? "bg-error" : "bg-amber-500";
  return (
    <span
      className={`inline-block size-2.5 rounded-full ${color}`}
      title={riskLevel}
    />
  );
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelative(iso: string | null) {
  if (!iso) return "—";
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  return `${diffDays}d ago`;
}

const columns: ColumnDef<SignalRow>[] = [
  {
    accessorKey: "riskLevel",
    header: "Risk",
    size: 60,
    cell: ({ row }) => <RiskDot riskLevel={row.getValue("riskLevel")} />,
  },
  {
    accessorKey: "title",
    header: "Title",
    size: 300,
    cell: ({ row }) => (
      <div className="max-w-[300px]">
        <p className="font-medium text-on-surface truncate">
          {row.getValue("title")}
        </p>
        {row.original.description && (
          <p className="text-xs text-secondary truncate mt-0.5">
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    size: 90,
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`text-xs font-medium ${
            status === "resolved" ? "text-outline" : "text-on-surface"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    id: "owner",
    accessorKey: "ownerName",
    header: "Owner",
    size: 100,
    cell: ({ row }) => {
      const name = row.original.ownerName;
      if (!name) return <span className="text-outline">—</span>;
      return <span className="text-xs text-on-surface">{name}</span>;
    },
  },
  {
    accessorKey: "focusedOnDate",
    header: "Focused",
    size: 80,
    cell: ({ row }) => {
      const val = row.getValue("focusedOnDate") as string | null;
      if (!val) return <span className="text-outline">—</span>;
      return <span className="text-xs text-on-surface">{formatDate(val)}</span>;
    },
  },
  {
    accessorKey: "lastWorkedAt",
    header: "Last Worked",
    size: 100,
    cell: ({ row }) => {
      const val = row.getValue("lastWorkedAt") as string | null;
      return (
        <span className="text-xs text-secondary">
          {formatRelative(val)}
        </span>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    size: 100,
    cell: ({ row }) => (
      <span className="text-xs text-secondary">
        {formatDate(row.getValue("createdAt"))}
      </span>
    ),
  },
  {
    accessorKey: "eventCount",
    header: "Events",
    size: 70,
    cell: ({ row }) => (
      <span className="text-xs text-secondary">
        {row.getValue("eventCount")}
      </span>
    ),
  },
];

function buildHref(params: { page?: number; sort?: string; order?: string; q?: string; resolved?: boolean }) {
  const sp = new URLSearchParams();
  if (params.page && params.page > 1) sp.set("page", String(params.page));
  if (params.sort && params.sort !== "createdAt") sp.set("sort", params.sort);
  if (params.order && params.order !== "desc") sp.set("order", params.order);
  if (params.q) sp.set("q", params.q);
  if (params.resolved) sp.set("resolved", "1");
  const qs = sp.toString();
  return `/signals${qs ? `?${qs}` : ""}`;
}

export function SignalsDataTable({
  data,
  page,
  totalPages,
  sort,
  order,
  q,
  showResolved,
}: {
  data: SignalRow[];
  page: number;
  totalPages: number;
  sort: string;
  order: "asc" | "desc";
  q: string;
  showResolved: boolean;
}) {
  const router = useRouter();
  const sorting: SortingState = [{ id: sort, desc: order === "desc" }];
  const [searchValue, setSearchValue] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resolved = showResolved;

  // Sync local input when the server-provided q changes (e.g. browser back/forward)
  useEffect(() => {
    setSearchValue(q);
  }, [q]);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        router.push(buildHref({ page: 1, sort, order, q: value.trim(), resolved }));
      }, 300);
    },
    [sort, order, resolved, router]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "ArrowLeft" && page > 1) {
        router.push(buildHref({ page: page - 1, sort, order, q, resolved }));
      } else if (e.key === "ArrowRight" && page < totalPages) {
        router.push(buildHref({ page: page + 1, sort, order, q, resolved }));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [page, totalPages, sort, order, q, resolved, router]);

  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      if (next.length === 0) {
        router.push(buildHref({ page: 1, q, resolved }));
      } else {
        const col = next[0];
        router.push(
          buildHref({ page: 1, sort: col.id, order: col.desc ? "desc" : "asc", q, resolved })
        );
      }
    },
    [sorting, router]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: handleSortingChange,
    state: { sorting },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Search signals…"
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
        <label className="flex items-center gap-2 text-sm text-secondary whitespace-nowrap cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showResolved}
            onChange={() =>
              router.push(buildHref({ page: 1, sort, order, q, resolved: !showResolved }))
            }
            className="accent-on-surface"
          />
          Show resolved
        </label>
      </div>

      <div className="rounded-lg border border-outline-variant/40">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-xs font-medium uppercase tracking-wider text-secondary cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                    style={{ width: header.getSize() }}
                  >
                    <span className="flex items-center gap-1">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      {{
                        asc: " ↑",
                        desc: " ↓",
                      }[header.column.getIsSorted() as string] ?? null}
                    </span>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer"
                  onClick={() =>
                    router.push(`/signals/${row.original.id}/events`)
                  }
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-secondary"
                >
                  {q ? "No matching signals found." : "No signals yet. Create one to get started."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-secondary">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={buildHref({ page: page - 1, sort, order, q, resolved })}>
                <Button variant="outline" size="sm">Previous</Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>Previous</Button>
            )}
            {page < totalPages ? (
              <Link href={buildHref({ page: page + 1, sort, order, q, resolved })}>
                <Button variant="outline" size="sm">Next</Button>
              </Link>
            ) : (
              <Button variant="outline" size="sm" disabled>Next</Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

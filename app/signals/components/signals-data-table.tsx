"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { NewEventDialog } from "@/app/components/new-event-dialog";

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
  {
    id: "actions",
    header: "",
    size: 100,
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <NewEventDialog
          signalId={row.original.id}
          signalTitle={row.original.title}
        >
          <Button
            size="sm"
            className="text-xs opacity-70 hover:opacity-100"
          >
            + Event
          </Button>
        </NewEventDialog>
      </div>
    ),
  },
];

export function SignalsDataTable({ data }: { data: SignalRow[] }) {
  const router = useRouter();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter signals…"
        value={globalFilter}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm"
      />

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
                  No signals yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

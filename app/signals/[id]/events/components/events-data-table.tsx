"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { useState } from "react";
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

type EventRow = {
  id: string;
  eventType: string;
  note: string | null;
  link: string | null;
  createdAt: string;
};

function formatEventType(eventType: string): string {
  return eventType
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

const columns: ColumnDef<EventRow>[] = [
  {
    accessorKey: "eventType",
    header: "Type",
    size: 140,
    cell: ({ row }) => (
      <span className="text-xs font-medium text-on-surface">
        {formatEventType(row.getValue("eventType"))}
      </span>
    ),
  },
  {
    accessorKey: "note",
    header: "Note",
    size: 400,
    cell: ({ row }) => {
      const note = row.getValue("note") as string | null;
      if (!note) return <span className="text-outline">—</span>;
      return (
        <p className="text-sm text-on-surface truncate max-w-[400px]">
          {note}
        </p>
      );
    },
  },
  {
    accessorKey: "link",
    header: "Link",
    size: 200,
    cell: ({ row }) => {
      const link = row.getValue("link") as string | null;
      if (!link) return <span className="text-outline">—</span>;
      return (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-secondary underline underline-offset-2 hover:text-on-surface truncate block max-w-[200px]"
        >
          {link}
        </a>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    size: 160,
    cell: ({ row }) => {
      const iso = row.getValue("createdAt") as string;
      return (
        <div>
          <span className="text-xs text-secondary">{formatDate(iso)}</span>
          <span className="text-xs text-outline ml-2">{formatTime(iso)}</span>
        </div>
      );
    },
  },
];

export function EventsDataTable({ data }: { data: EventRow[] }) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    state: { sorting, globalFilter },
    initialState: { pagination: { pageSize: 10 } },
  });

  return (
    <div className="space-y-4">
      <Input
        placeholder="Filter events…"
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
                <TableRow key={row.id}>
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
                  No events found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Paginator */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-secondary">
          Page {table.getState().pagination.pageIndex + 1} of{" "}
          {table.getPageCount()}
        </p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="text-xs"
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="text-xs"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

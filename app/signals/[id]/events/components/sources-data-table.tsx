"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
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
import { SourceFormDialog } from "./source-form-dialog";
import { DeleteSourceButton } from "./delete-source-button";
import { useMemo } from "react";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export type SourceRow = {
  id: string;
  signalId: string;
  type: string;
  label: string;
  url: string | null;
  note: string | null;
  createdAt: string;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildColumns(
  sourceTypeOptions?: { value: string; label: string }[]
): ColumnDef<SourceRow>[] {
  return [
  {
    accessorKey: "type",
    header: "Type",
    size: 100,
    cell: ({ row }) => (
      <span className="inline-flex items-center rounded-md bg-outline-variant/20 px-2 py-0.5 text-xs font-medium text-secondary">
        {capitalize(row.getValue("type") as string)}
      </span>
    ),
  },
  {
    accessorKey: "label",
    header: "Label",
    size: 300,
    cell: ({ row }) => (
      <span className="text-sm font-medium text-on-surface">
        {row.getValue("label")}
      </span>
    ),
  },
  {
    accessorKey: "note",
    header: "Note",
    size: 300,
    cell: ({ row }) => {
      const note = row.getValue("note") as string | null;
      if (!note) return <span className="text-outline">—</span>;
      return (
        <p className="text-sm text-on-surface truncate max-w-[300px]">
          {note}
        </p>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Added",
    size: 120,
    cell: ({ row }) => (
      <span className="text-xs text-secondary">
        {formatDate(row.getValue("createdAt"))}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
    size: 100,
    enableSorting: false,
    cell: ({ row }) => {
      const source = row.original;
      return (
        <div className="flex items-center justify-end gap-1">
          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-outline hover:text-secondary transition-colors px-1.5 py-1"
              aria-label={`Open ${source.label}`}
            >
              Open
            </a>
          )}
          <SourceFormDialog
            signalId={source.signalId}
            mode="edit"
            sourceTypeOptions={sourceTypeOptions}
            initialData={{
              sourceId: source.id,
              type: source.type,
              label: source.label,
              url: source.url,
              note: source.note,
            }}
          >
            <button
              type="button"
              className="text-xs text-outline hover:text-secondary transition-colors px-1.5 py-1"
              aria-label={`Edit ${source.label}`}
            >
              Edit
            </button>
          </SourceFormDialog>
          <DeleteSourceButton sourceId={source.id} sourceLabel={source.label}>
            <button
              type="button"
              className="text-xs text-outline hover:text-destructive transition-colors px-1.5 py-1"
              aria-label={`Delete ${source.label}`}
            >
              Delete
            </button>
          </DeleteSourceButton>
        </div>
      );
    },
  },
  ];
}

export function SourcesDataTable({
  data,
  sourceTypeOptions,
}: {
  data: SourceRow[];
  sourceTypeOptions?: { value: string; label: string }[];
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const columns = useMemo(
    () => buildColumns(sourceTypeOptions),
    [sourceTypeOptions]
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
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
                No sources attached.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

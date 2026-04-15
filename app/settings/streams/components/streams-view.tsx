"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/table";
import { StreamFormDialog } from "./stream-form-dialog";
import { DeleteStreamButton } from "./delete-stream-button";
import { Button } from "@/components/core/button";
import { SectionCard } from "@/components/ui/section-card";
import { Plus } from "lucide-react";

export type StreamRow = {
  id: string;
  key: string;
  name: string;
  createdAt: string;
};

export function StreamsView({ streams }: { streams: StreamRow[] }) {
  return (
    <SectionCard
      title="Streams"
      actions={
        <StreamFormDialog mode="add">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add stream
          </Button>
        </StreamFormDialog>
      }
    >
      <p className="text-sm text-secondary -mt-3 mb-5">
        Manage streams for categorising signals. A signal can belong to multiple
        streams.
      </p>

      {streams.length === 0 ? (
        <div className="rounded-lg border border-outline-variant/40 p-12 text-center">
          <p className="text-secondary text-sm">
            No streams yet. Add one to start organising signals.
          </p>
          <StreamFormDialog mode="add">
            <Button variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1.5" />
              Add your first stream
            </Button>
          </StreamFormDialog>
        </div>
      ) : (
        <div className="rounded-lg border border-outline-variant/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary">
                  Key
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {streams.map((stream) => (
                <TableRow key={stream.id}>
                  <TableCell>
                    <code className="text-sm text-on-surface">
                      {stream.key}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-on-surface font-medium">
                      {stream.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <StreamFormDialog
                        mode="edit"
                        initialData={{
                          id: stream.id,
                          key: stream.key,
                          name: stream.name,
                        }}
                      >
                        <button
                          type="button"
                          className="text-xs text-outline hover:text-secondary transition-colors px-1.5 py-1"
                        >
                          Edit
                        </button>
                      </StreamFormDialog>
                      <DeleteStreamButton
                        streamId={stream.id}
                        name={stream.name}
                      >
                        <button
                          type="button"
                          className="text-xs text-outline hover:text-destructive transition-colors px-1.5 py-1"
                        >
                          Delete
                        </button>
                      </DeleteStreamButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </SectionCard>
  );
}

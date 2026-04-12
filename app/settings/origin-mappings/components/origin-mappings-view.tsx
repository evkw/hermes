"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/table";
import { MappingFormDialog } from "./mapping-form-dialog";
import { DeleteMappingButton } from "./delete-mapping-button";
import { Button } from "@/components/core/button";
import { SectionCard } from "@/components/ui/section-card";
import { Plus } from "lucide-react";

export type MappingRow = {
  id: string;
  matchValue: string;
  sourceType: string;
  label: string | null;
  createdAt: string;
};

export function OriginMappingsView({ mappings }: { mappings: MappingRow[] }) {
  return (
    <SectionCard
      title="Origin Mappings"
      actions={
        <MappingFormDialog mode="add">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add mapping
          </Button>
        </MappingFormDialog>
      }
    >
      <p className="text-sm text-secondary -mt-3 mb-5">
        Map URL hostnames to source types. When you add a source URL,
        Hermes uses these mappings to automatically detect the type.
      </p>

      {mappings.length === 0 ? (
        <div className="rounded-lg border border-outline-variant/40 p-12 text-center">
          <p className="text-secondary text-sm">
            No origin mappings yet. Add one to start auto-detecting source types
            from URLs.
          </p>
          <MappingFormDialog mode="add">
            <Button variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1.5" />
              Add your first mapping
            </Button>
          </MappingFormDialog>
        </div>
      ) : (
        <div className="rounded-lg border border-outline-variant/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary">
                  Hostname
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary">
                  Source Type
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary">
                  Label
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping) => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <code className="text-sm text-on-surface">
                      {mapping.matchValue}
                    </code>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center rounded-md bg-outline-variant/20 px-2 py-0.5 text-xs font-medium text-secondary">
                      {mapping.sourceType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-secondary">
                      {mapping.label ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <MappingFormDialog
                        mode="edit"
                        initialData={{
                          id: mapping.id,
                          matchValue: mapping.matchValue,
                          sourceType: mapping.sourceType,
                          label: mapping.label,
                        }}
                      >
                        <button
                          type="button"
                          className="text-xs text-outline hover:text-secondary transition-colors px-1.5 py-1"
                        >
                          Edit
                        </button>
                      </MappingFormDialog>
                      <DeleteMappingButton
                        mappingId={mapping.id}
                        hostname={mapping.matchValue}
                      >
                        <button
                          type="button"
                          className="text-xs text-outline hover:text-destructive transition-colors px-1.5 py-1"
                        >
                          Delete
                        </button>
                      </DeleteMappingButton>
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

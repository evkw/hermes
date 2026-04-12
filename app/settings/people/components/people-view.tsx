"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/core/table";
import { PersonFormDialog } from "./person-form-dialog";
import { DeletePersonButton } from "./delete-person-button";
import { Button } from "@/components/core/button";
import { SectionCard } from "@/components/ui/section-card";
import { Plus } from "lucide-react";

export type PersonRow = {
  id: string;
  name: string;
  notes: string | null;
  createdAt: string;
};

export function PeopleView({ people }: { people: PersonRow[] }) {
  return (
    <SectionCard
      title="People"
      actions={
        <PersonFormDialog mode="add">
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add person
          </Button>
        </PersonFormDialog>
      }
    >
      <p className="text-sm text-secondary -mt-3 mb-5">
        Manage people for use across Hermes, such as signal ownership and
        delegation.
      </p>

      {people.length === 0 ? (
        <div className="rounded-lg border border-outline-variant/40 p-12 text-center">
          <p className="text-secondary text-sm">
            No people yet. Add someone to get started.
          </p>
          <PersonFormDialog mode="add">
            <Button variant="outline" size="sm" className="mt-4">
              <Plus className="h-4 w-4 mr-1.5" />
              Add your first person
            </Button>
          </PersonFormDialog>
        </div>
      ) : (
        <div className="rounded-lg border border-outline-variant/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary">
                  Name
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary">
                  Notes
                </TableHead>
                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {people.map((person) => (
                <TableRow key={person.id}>
                  <TableCell>
                    <span className="text-sm text-on-surface font-medium">
                      {person.name}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-secondary">
                      {person.notes ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <PersonFormDialog
                        mode="edit"
                        initialData={{
                          id: person.id,
                          name: person.name,
                          notes: person.notes,
                        }}
                      >
                        <button
                          type="button"
                          className="text-xs text-outline hover:text-secondary transition-colors px-1.5 py-1"
                        >
                          Edit
                        </button>
                      </PersonFormDialog>
                      <DeletePersonButton
                        personId={person.id}
                        name={person.name}
                      >
                        <button
                          type="button"
                          className="text-xs text-outline hover:text-destructive transition-colors px-1.5 py-1"
                        >
                          Delete
                        </button>
                      </DeletePersonButton>
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

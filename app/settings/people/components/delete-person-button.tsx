"use client";

import { useActionState, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/core/dialog";
import { Button } from "@/components/core/button";
import {
  deletePerson,
  type PersonActionState,
} from "@/app/actions/people";

const initialState: PersonActionState = { success: false };

export function DeletePersonButton({
  personId,
  name,
  children,
}: {
  personId: string;
  name: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deletePerson,
    initialState
  );

  useEffect(() => {
    if (state.success) {
      setOpen(false);
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger nativeButton={false} render={<span />}>
        {children}
      </DialogTrigger>

      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete Person</DialogTitle>
          <DialogDescription>
            Delete &ldquo;{name}&rdquo;? This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <input type="hidden" name="id" value={personId} />
          <DialogFooter>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

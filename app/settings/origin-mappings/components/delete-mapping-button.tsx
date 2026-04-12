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
  deleteOriginMapping,
  type MappingActionState,
} from "@/app/actions/origin-mappings";

const initialState: MappingActionState = { success: false };

export function DeleteMappingButton({
  mappingId,
  hostname,
  children,
}: {
  mappingId: string;
  hostname: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(
    deleteOriginMapping,
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
          <DialogTitle>Delete Mapping</DialogTitle>
          <DialogDescription>
            Delete the mapping for &ldquo;{hostname}&rdquo;? This cannot be
            undone.
          </DialogDescription>
        </DialogHeader>

        <form action={formAction}>
          <input type="hidden" name="id" value={mappingId} />
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

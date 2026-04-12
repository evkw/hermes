"use client";

import { useActionState, useEffect, useRef, useState } from "react";
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
import { Input } from "@/components/core/input";
import { Label } from "@/components/core/label";
import {
  createPerson,
  updatePerson,
  type PersonActionState,
} from "@/app/actions/people";
import { useSubmitShortcut } from "@/app/hooks/use-submit-shortcut";

const initialState: PersonActionState = { success: false };

type PersonFormDialogProps = {
  children: React.ReactNode;
} & (
  | { mode: "add" }
  | {
      mode: "edit";
      initialData: {
        id: string;
        name: string;
        notes: string | null;
      };
    }
);

export function PersonFormDialog(props: PersonFormDialogProps) {
  const { mode, children } = props;
  const isEdit = mode === "edit";
  const action = isEdit ? updatePerson : createPerson;

  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  useSubmitShortcut(formRef);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger nativeButton={false} render={<span />}>
        {children}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Person" : "Add Person"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this person's details."
              : "Add a new person for use across Hermes."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          {isEdit && (
            <input type="hidden" name="id" value={props.initialData.id} />
          )}

          <div className="grid gap-2">
            <Label htmlFor="person-name">Name</Label>
            <Input
              id="person-name"
              name="name"
              placeholder="e.g. Jane Smith"
              required
              autoFocus
              defaultValue={isEdit ? props.initialData.name : ""}
            />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive" aria-live="polite">
                {state.fieldErrors.name}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="person-notes">
              Notes{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="person-notes"
              name="notes"
              placeholder="e.g. Engineering lead"
              defaultValue={isEdit ? (props.initialData.notes ?? "") : ""}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending
                ? isEdit
                  ? "Saving…"
                  : "Adding…"
                : isEdit
                  ? "Save Changes"
                  : "Add Person"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
  createOriginMapping,
  updateOriginMapping,
  type MappingActionState,
} from "@/app/actions/origin-mappings";
import { useSubmitShortcut } from "@/app/hooks/use-submit-shortcut";

const initialState: MappingActionState = { success: false };

type MappingFormDialogProps = {
  children: React.ReactNode;
} & (
  | { mode: "add" }
  | {
      mode: "edit";
      initialData: {
        id: string;
        matchValue: string;
        sourceType: string;
        label: string | null;
      };
    }
);

export function MappingFormDialog(props: MappingFormDialogProps) {
  const { mode, children } = props;
  const isEdit = mode === "edit";
  const action = isEdit ? updateOriginMapping : createOriginMapping;

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
            {isEdit ? "Edit Mapping" : "Add Origin Mapping"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this origin mapping."
              : "Map a URL hostname to a source type for automatic detection."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          {isEdit && (
            <input type="hidden" name="id" value={props.initialData.id} />
          )}

          <div className="grid gap-2">
            <Label htmlFor="mapping-match">Hostname</Label>
            <Input
              id="mapping-match"
              name="matchValue"
              placeholder="e.g. gitlab.example.com"
              required
              autoFocus
              defaultValue={isEdit ? props.initialData.matchValue : ""}
            />
            {state.fieldErrors?.matchValue && (
              <p className="text-sm text-destructive" aria-live="polite">
                {state.fieldErrors.matchValue}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mapping-type">Source Type</Label>
            <Input
              id="mapping-type"
              name="sourceType"
              placeholder="e.g. gitlab, jira, figma"
              required
              defaultValue={isEdit ? props.initialData.sourceType : ""}
            />
            {state.fieldErrors?.sourceType && (
              <p className="text-sm text-destructive" aria-live="polite">
                {state.fieldErrors.sourceType}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="mapping-label">
              Label{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id="mapping-label"
              name="label"
              placeholder="e.g. GitLab Link"
              defaultValue={isEdit ? (props.initialData.label ?? "") : ""}
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
                  : "Add Mapping"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

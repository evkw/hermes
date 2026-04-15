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
  createStream,
  updateStream,
  type StreamActionState,
} from "@/app/actions/streams";
import { useSubmitShortcut } from "@/app/hooks/use-submit-shortcut";

const initialState: StreamActionState = { success: false };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type StreamFormDialogProps = {
  children: React.ReactNode;
} & (
  | { mode: "add" }
  | {
      mode: "edit";
      initialData: {
        id: string;
        key: string;
        name: string;
      };
    }
);

export function StreamFormDialog(props: StreamFormDialogProps) {
  const { mode, children } = props;
  const isEdit = mode === "edit";
  const action = isEdit ? updateStream : createStream;

  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const [key, setKey] = useState(isEdit ? props.initialData.key : "");
  const [keyTouched, setKeyTouched] = useState(false);
  useSubmitShortcut(formRef);

  useEffect(() => {
    if (state.success) {
      setOpen(false);
      formRef.current?.reset();
      setKey("");
      setKeyTouched(false);
    }
  }, [state]);

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!keyTouched) {
      setKey(slugify(e.target.value));
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger nativeButton={false} render={<span />}>
        {children}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Stream" : "Add Stream"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this stream's details."
              : "Add a new stream for categorising signals."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          {isEdit && (
            <input type="hidden" name="id" value={props.initialData.id} />
          )}

          <div className="grid gap-2">
            <Label htmlFor="stream-name">Name</Label>
            <Input
              id="stream-name"
              name="name"
              placeholder="e.g. Work"
              required
              autoFocus
              defaultValue={isEdit ? props.initialData.name : ""}
              onChange={handleNameChange}
            />
            {state.fieldErrors?.name && (
              <p className="text-sm text-destructive" aria-live="polite">
                {state.fieldErrors.name}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="stream-key">Key</Label>
            <Input
              id="stream-key"
              name="key"
              placeholder="e.g. work"
              required
              value={key}
              onChange={(e) => {
                setKeyTouched(true);
                setKey(e.target.value);
              }}
            />
            <p className="text-xs text-secondary">
              Lowercase slug used for filtering. Auto-generated from name.
            </p>
            {state.fieldErrors?.key && (
              <p className="text-sm text-destructive" aria-live="polite">
                {state.fieldErrors.key}
              </p>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-destructive" aria-live="polite">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending
                ? isEdit
                  ? "Saving…"
                  : "Adding…"
                : isEdit
                  ? "Save Changes"
                  : "Add Stream"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

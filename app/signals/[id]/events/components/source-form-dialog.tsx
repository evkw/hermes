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
import { Textarea } from "@/components/core/textarea";
import { Label } from "@/components/core/label";
import {
  createSignalSource,
  updateSignalSource,
  type SourceActionState,
} from "@/app/actions/signals";
import { useSubmitShortcut } from "@/app/hooks/use-submit-shortcut";

const SOURCE_TYPE_OPTIONS = [
  { value: "manual", label: "Manual" },
  { value: "teams", label: "Teams" },
  { value: "gitlab", label: "GitLab" },
  { value: "jira", label: "Jira" },
  { value: "url_other", label: "URL / Other" },
] as const;

const initialState: SourceActionState = { success: false };

type SourceFormDialogProps = {
  signalId: string;
  children: React.ReactNode;
} & (
  | { mode: "add" }
  | {
      mode: "edit";
      initialData: {
        sourceId: string;
        type: string;
        label: string;
        url: string | null;
        note: string | null;
      };
    }
);

export function SourceFormDialog(props: SourceFormDialogProps) {
  const { signalId, mode, children } = props;
  const isEdit = mode === "edit";
  const action = isEdit ? updateSignalSource : createSignalSource;

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
          <DialogTitle>{isEdit ? "Edit Source" : "Add Source"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this source's details."
              : "Paste a URL — the type and label will be detected automatically."}
          </DialogDescription>
        </DialogHeader>

        <form ref={formRef} action={formAction} className="grid gap-4">
          {isEdit ? (
            <input
              type="hidden"
              name="sourceId"
              value={props.initialData.sourceId}
            />
          ) : (
            <input type="hidden" name="signalId" value={signalId} />
          )}

          {isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="source-type">Type</Label>
              <select
                id="source-type"
                name="type"
                defaultValue={props.initialData.type}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {SOURCE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="source-label">Label</Label>
              <Input
                id="source-label"
                name="label"
                placeholder="e.g. Jira ticket, Teams thread…"
                required
                defaultValue={props.initialData.label}
              />
              {state.fieldErrors?.label && (
                <p className="text-sm text-destructive" aria-live="polite">
                  {state.fieldErrors.label}
                </p>
              )}
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="source-url">
              {isEdit ? (
                <>
                  URL{" "}
                  <span className="text-muted-foreground font-normal">
                    (optional)
                  </span>
                </>
              ) : (
                "Source URL"
              )}
            </Label>
            <Input
              id="source-url"
              name="url"
              type="url"
              placeholder="https://..."
              required={!isEdit}
              autoFocus
              defaultValue={isEdit ? (props.initialData.url ?? "") : ""}
            />
            {state.fieldErrors?.url && (
              <p className="text-sm text-destructive" aria-live="polite">
                {state.fieldErrors.url}
              </p>
            )}
          </div>

          {isEdit && (
            <div className="grid gap-2">
              <Label htmlFor="source-note">
                Note{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="source-note"
                name="note"
                placeholder="Any additional context…"
                rows={2}
                defaultValue={props.initialData.note ?? ""}
              />
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending
                ? isEdit
                  ? "Saving…"
                  : "Adding…"
                : isEdit
                  ? "Save Changes"
                  : "Add Source"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

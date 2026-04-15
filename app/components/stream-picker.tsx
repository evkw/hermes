"use client";

import { useState } from "react";

type Stream = {
  id: string;
  key: string;
  name: string;
};

export function StreamPicker({
  streams,
  selectedIds = [],
  name = "streamIds",
}: {
  streams: Stream[];
  selectedIds?: string[];
  name?: string;
}) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(selectedIds)
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  if (streams.length === 0) return null;

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium leading-none">
        Streams{" "}
        <span className="text-muted-foreground font-normal">(optional)</span>
      </span>
      <div className="flex flex-wrap gap-1.5">
        {streams.map((stream) => {
          const isSelected = selected.has(stream.id);
          return (
            <button
              key={stream.id}
              type="button"
              onClick={() => toggle(stream.id)}
              className={
                isSelected
                  ? "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-primary/15 text-primary border border-primary/30 transition-colors"
                  : "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium bg-outline-variant/10 text-secondary border border-outline-variant/30 hover:border-outline-variant/60 transition-colors"
              }
            >
              {stream.name}
            </button>
          );
        })}
      </div>
      {/* Hidden inputs for form submission */}
      {Array.from(selected).map((id) => (
        <input key={id} type="hidden" name={name} value={id} />
      ))}
    </div>
  );
}

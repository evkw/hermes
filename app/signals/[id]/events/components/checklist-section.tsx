"use client";

import { useState, type ReactNode } from "react";
import { toggleChecklistItem, deleteChecklistItem } from "@/app/actions/signals";

type ChecklistItem = {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt: string | null;
  note: string | null;
};

export function ChecklistSection({
  items,
  addButton,
}: {
  items: ChecklistItem[];
  addButton: ReactNode;
}) {
  const [showCompleted, setShowCompleted] = useState(false);
  const completedCount = items.filter((i) => i.isCompleted).length;
  const totalCount = items.length;

  const visibleItems = showCompleted
    ? items
    : items.filter((i) => !i.isCompleted);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-4">
          <h2 className="text-xs font-medium uppercase tracking-wider text-outline">
            Checklist — {completedCount}/{totalCount} complete
          </h2>
          {completedCount > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showCompleted}
                onChange={(e) => setShowCompleted(e.target.checked)}
                className="rounded border-outline"
              />
              Show completed
            </label>
          )}
        </div>
        <div className="flex items-center gap-2">{addButton}</div>
      </div>

      {totalCount === 0 ? (
        <p className="text-sm text-secondary">
          No checklist items yet. Add one to track actions for this signal.
        </p>
      ) : visibleItems.length === 0 ? (
        <p className="text-sm text-secondary">
          All items complete. Toggle &ldquo;Show completed&rdquo; to view them.
        </p>
      ) : (
        <ul className="divide-y divide-outline/20">
      {visibleItems.map((item) => (
        <li key={item.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
          <form action={toggleChecklistItem.bind(null, item.id)} className="pt-0.5">
            <button
              type="submit"
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                item.isCompleted
                  ? "border-primary bg-primary text-on-primary"
                  : "border-outline"
              }`}
              aria-label={
                item.isCompleted
                  ? `Mark "${item.title}" incomplete`
                  : `Mark "${item.title}" complete`
              }
            >
              {item.isCompleted && (
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </button>
          </form>

          <div className="min-w-0 flex-1">
            <p
              className={`text-sm ${
                item.isCompleted
                  ? "line-through text-secondary"
                  : "text-on-surface"
              }`}
            >
              {item.title}
            </p>
            {item.note && (
              <p className="mt-0.5 text-xs text-secondary">{item.note}</p>
            )}
            {item.isCompleted && item.completedAt && (
              <p className="mt-0.5 text-xs text-outline">
                Completed{" "}
                {new Date(item.completedAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            )}
          </div>

          <form action={deleteChecklistItem.bind(null, item.id)}>
            <button
              type="submit"
              className="shrink-0 rounded p-1 text-xs text-secondary hover:text-destructive"
              aria-label={`Delete "${item.title}"`}
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </form>
        </li>
      ))}
    </ul>
      )}
    </div>
  );
}

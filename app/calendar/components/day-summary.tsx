"use client";

import Link from "next/link";
import { useState, useRef, useCallback, useTransition, useEffect } from "react";
import type { MonthData, DaySignalActivity } from "../page";
import type { SummaryMode } from "./calendar-view";
import { SectionCard } from "@/components/ui/section-card";
import { ExternalLink, Eye, EyeOff } from "lucide-react";
import { toggleSummaryExclusion } from "@/app/actions/signals";

const DAY_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MONTH_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export type SummaryItem = {
    signalId: string;
    label: string;
    title: string;
    url?: string;
    excludedFromSummary: boolean;
    streams: { id: string; name: string }[];
};

function summarizeSignals(signals: DaySignalActivity[]): SummaryItem[] {
    return signals.map((s) => {
        const base = { signalId: s.signalId, title: s.title, url: s.primarySourceUrl, excludedFromSummary: s.excludedFromSummary, streams: s.streams };
        if (s.resolved) return { label: "Resolved", ...base };
        if (s.created) return { label: "Started", ...base };
        if (s.worked) return { label: "Progressed", ...base };
        return { label: "Touched", ...base };
    });
}

function dayKey(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

type DayEntry = {
    day: number;
    dayOfWeek: string;
    items: SummaryItem[];
    dateKey: string;
};

/** Flat row for keyboard navigation — either a day header, stream header, or an item row */
type FlatRow =
    | { type: "header"; dayEntry: DayEntry }
    | { type: "stream-header"; group: StreamGroup }
    | { type: "item"; item: SummaryItem; dateKey: string; flatIndex: number };

type StreamGroup = {
    key: string;
    label: string;
    items: SummaryItem[];
    /** Use the first signal's dateKey for hide/unhide in stream mode */
    dateKeys: Map<string, string>;
};

function buildFlatRows(dayEntries: DayEntry[], isSingleDay: boolean): FlatRow[] {
    const rows: FlatRow[] = [];
    if (isSingleDay) {
        for (const item of dayEntries[0].items) {
            rows.push({ type: "item", item, dateKey: dayEntries[0].dateKey, flatIndex: rows.length });
        }
    } else {
        for (const d of dayEntries) {
            rows.push({ type: "header", dayEntry: d });
            for (const item of d.items) {
                rows.push({ type: "item", item, dateKey: d.dateKey, flatIndex: rows.length });
            }
        }
    }
    return rows;
}

function buildStreamGroups(dayEntries: DayEntry[]): StreamGroup[] {
    // Collect unique signals across all days, keeping best label (Resolved > Started > Progressed > Touched)
    const seen = new Map<string, { item: SummaryItem; dateKey: string }>();
    const labelRank: Record<string, number> = { Resolved: 3, Started: 2, Progressed: 1, Touched: 0 };

    for (const d of dayEntries) {
        for (const item of d.items) {
            const existing = seen.get(item.signalId);
            if (!existing || (labelRank[item.label] ?? 0) > (labelRank[existing.item.label] ?? 0)) {
                seen.set(item.signalId, { item, dateKey: d.dateKey });
            }
        }
    }

    // Group by normalized stream combination
    const groupMap = new Map<string, StreamGroup>();
    for (const { item, dateKey } of seen.values()) {
        const sortedNames = item.streams.map((s) => s.name).sort();
        const key = sortedNames.join("|") || "";
        const label = sortedNames.length > 0 ? sortedNames.join(" > ") : "Misc";
        if (!groupMap.has(key)) {
            groupMap.set(key, { key, label, items: [], dateKeys: new Map() });
        }
        const group = groupMap.get(key)!;
        group.items.push(item);
        group.dateKeys.set(item.signalId, dateKey);
    }

    return Array.from(groupMap.values()).sort((a, b) => {
        // Misc always last
        if (a.key === "" && b.key !== "") return 1;
        if (b.key === "" && a.key !== "") return -1;
        // Most signals first
        return b.items.length - a.items.length;
    });
}

function buildStreamFlatRows(groups: StreamGroup[]): FlatRow[] {
    const rows: FlatRow[] = [];
    const isSingleGroup = groups.length === 1;
    for (const group of groups) {
        if (!isSingleGroup) {
            rows.push({ type: "stream-header", group });
        }
        for (const item of group.items) {
            rows.push({ type: "item", item, dateKey: group.dateKeys.get(item.signalId) ?? "", flatIndex: rows.length });
        }
    }
    return rows;
}

function getItemRowIndices(rows: FlatRow[]): number[] {
    return rows.reduce<number[]>((acc, row, i) => {
        if (row.type === "item") acc.push(i);
        return acc;
    }, []);
}

function SummaryRow({
    item,
    dateKey,
    isFocused,
    onMouseEnter,
    onClick,
}: {
    item: SummaryItem;
    dateKey: string;
    isFocused: boolean;
    onMouseEnter: () => void;
    onClick: () => void;
}) {
    const [pending, startTransition] = useTransition();

    function handleToggle() {
        const fd = new FormData();
        fd.set("signalId", item.signalId);
        fd.set("date", dateKey);
        startTransition(() => {
            toggleSummaryExclusion(null, fd);
        });
    }

    return (
        <tr
            className={`group text-sm transition-colors ${item.excludedFromSummary ? "opacity-40" : ""} ${isFocused ? "bg-surface-container/60 outline outline-1 -outline-offset-1 outline-primary/30" : ""} ${pending ? "opacity-60" : ""}`}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
            data-focused={isFocused || undefined}
        >
            {/* Visibility indicator */}
            <td className="w-8 py-1.5 pr-1 text-center align-middle">
                {item.excludedFromSummary ? (
                    <EyeOff className="size-3.5 text-outline mx-auto" />
                ) : (
                    <Eye className="size-3.5 text-secondary mx-auto" />
                )}
            </td>

            {/* Summary text */}
            <td className="py-1.5 px-2 align-middle">
                <span className="text-secondary">{item.label}</span>{" "}
                {item.url ? (
                    <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary underline-offset-2 hover:underline inline-flex items-center gap-1"
                        tabIndex={-1}
                    >
                        {item.title}
                        <ExternalLink className="size-3 inline shrink-0" />
                    </a>
                ) : (
                    <span className="font-medium text-on-surface">{item.title}</span>
                )}
            </td>

            {/* Signal link */}
            <td className="w-[120px] py-1.5 px-2 align-middle">
                <Link
                    href={`/signals/${item.signalId}/events`}
                    className="text-xs text-secondary hover:text-primary truncate block max-w-[120px]"
                    tabIndex={-1}
                    title={item.title}
                >
                    {item.title}
                </Link>
            </td>

            {/* Actions */}
            <td className="w-[60px] py-1.5 pl-2 text-right align-middle">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleToggle();
                    }}
                    className="text-xs text-outline hover:text-secondary transition-colors"
                    tabIndex={-1}
                >
                    {item.excludedFromSummary ? "Unhide" : "Hide"}
                </button>
            </td>
        </tr>
    );
}

export function DaySummary({
    year,
    month,
    selectedDays,
    data,
    tableRef: externalTableRef,
    editMode,
    onExitEditMode,
    summaryMode,
    modeToggle,
}: {
    year: number;
    month: number;
    selectedDays: Set<number>;
    data: MonthData;
    tableRef: React.RefObject<HTMLTableElement | null>;
    editMode: boolean;
    onExitEditMode: () => void;
    summaryMode: SummaryMode;
    modeToggle: React.ReactNode;
}) {
    const sortedDays = Array.from(selectedDays).sort((a, b) => a - b);
    const tableRef = externalTableRef;

    const dayEntries = sortedDays.map((day) => {
        const date = new Date(year, month, day);
        const dayOfWeek = DAY_OF_WEEK[date.getDay()];
        const signals = data[dayKey(year, month, day)]?.signals ?? [];
        const items = summarizeSignals(signals);
        return { day, dayOfWeek, items, dateKey: dayKey(year, month, day) };
    });

    const hasAnyIncludedItems = dayEntries.some((d) => d.items.some((i) => !i.excludedFromSummary));
    const isSingleDay = sortedDays.length === 1;
    const hasItems = dayEntries.some((d) => d.items.length > 0);

    const isStreamMode = summaryMode === "by-stream";
    const streamGroups = isStreamMode ? buildStreamGroups(dayEntries) : [];
    const flatRows = isStreamMode
        ? buildStreamFlatRows(streamGroups)
        : buildFlatRows(dayEntries, isSingleDay);
    const itemIndices = getItemRowIndices(flatRows);

    const [focusedRowIdx, setFocusedRowIdx] = useState<number>(-1);

    // Reset focus when entering edit mode
    useEffect(() => {
        if (editMode && itemIndices.length > 0) {
            setFocusedRowIdx(itemIndices[0]);
        }
        if (!editMode) {
            setFocusedRowIdx(-1);
        }
    }, [editMode]);

    const titleLabel = isSingleDay
        ? `${MONTH_SHORT[month]} ${sortedDays[0]}, ${year}`
        : `${MONTH_SHORT[month]} ${sortedDays[0]}–${sortedDays[sortedDays.length - 1]}, ${year}`;

    function buildSummaryText(): string {
        function formatItem(i: SummaryItem): string {
            return i.url ? `• ${i.label} [${i.title}](${i.url})` : `• ${i.label} ${i.title}`;
        }
        if (isStreamMode) {
            return streamGroups
                .map((g) => {
                    const header = `### ${g.label}`;
                    const included = g.items.filter((i) => !i.excludedFromSummary);
                    if (included.length === 0) return header;
                    const bullets = included.map(formatItem).join("\n");
                    return `${header}\n${bullets}`;
                })
                .join("\n\n");
        }
        if (isSingleDay) {
            const included = dayEntries[0].items.filter((i) => !i.excludedFromSummary);
            if (included.length === 0) return "No activity";
            return included.map(formatItem).join("\n");
        }
        return dayEntries
            .map((d) => {
                const header = `### ${d.dayOfWeek}`;
                const included = d.items.filter((i) => !i.excludedFromSummary);
                if (included.length === 0) return header;
                const bullets = included.map(formatItem).join("\n");
                return `${header}\n${bullets}`;
            })
            .join("\n\n");
    }

    const toggleFocusedItem = useCallback(() => {
        if (focusedRowIdx < 0 || focusedRowIdx >= flatRows.length) return;
        const row = flatRows[focusedRowIdx];
        if (row.type !== "item") return;

        const fd = new FormData();
        fd.set("signalId", row.item.signalId);
        fd.set("date", row.dateKey);
        toggleSummaryExclusion(null, fd);
    }, [focusedRowIdx, flatRows]);

    const handleTableKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTableElement>) => {
            if (itemIndices.length === 0) return;

            const currentPos = itemIndices.indexOf(focusedRowIdx);

            if (e.key === "ArrowDown") {
                e.preventDefault();
                e.stopPropagation();
                const nextPos = currentPos < 0 ? 0 : Math.min(itemIndices.length - 1, currentPos + 1);
                setFocusedRowIdx(itemIndices[nextPos]);
                return;
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                e.stopPropagation();
                const nextPos = currentPos <= 0 ? 0 : currentPos - 1;
                setFocusedRowIdx(itemIndices[nextPos]);
                return;
            }

            if (e.key === "Escape") {
                e.preventDefault();
                setFocusedRowIdx(-1);
                tableRef.current?.blur();
                onExitEditMode();
                return;
            }

            if (e.key === "h" || e.key === "H") {
                if (focusedRowIdx >= 0) {
                    e.preventDefault();
                    toggleFocusedItem();
                }
                return;
            }

            if (e.key === "Enter") {
                e.preventDefault();
                setFocusedRowIdx(-1);
                tableRef.current?.blur();
                onExitEditMode();
                return;
            }

            if (e.key === " ") {
                if (focusedRowIdx >= 0) {
                    e.preventDefault();
                    toggleFocusedItem();
                }
                return;
            }
        },
        [focusedRowIdx, itemIndices, toggleFocusedItem]
    );

    const handleFocus = useCallback(() => {
        if (focusedRowIdx < 0 && itemIndices.length > 0) {
            setFocusedRowIdx(itemIndices[0]);
        }
    }, [focusedRowIdx, itemIndices]);

    const handleBlur = useCallback(() => {
        // Only clear if exiting edit mode (parent controls editMode state)
    }, []);

    return (
        <SectionCard
            title={titleLabel}
            actions={
                <div className="flex items-center gap-2">
                    {modeToggle}
                    {hasAnyIncludedItems ? (
                        <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(buildSummaryText())}
                            className="px-3 py-1.5 text-sm rounded-md border border-outline-variant/40 text-secondary hover:text-on-surface hover:border-outline transition-colors"
                        >
                            Copy
                        </button>
                    ) : null}
                </div>
            }
            className="mt-4"
        >
            {!hasItems ? (
                <p className="text-sm text-secondary">
                    {isSingleDay ? "No signal activity on this day." : "No signal activity for selected days."}
                </p>
            ) : (
                <>
                    <table
                        ref={tableRef}
                        tabIndex={0}
                        className="w-full border-collapse focus:outline-none"
                        onKeyDown={handleTableKeyDown}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        role="grid"
                        aria-label="Day summary"
                    >
                        <tbody>
                            {flatRows.map((row, i) => {
                                if (row.type === "header") {
                                    return (
                                        <tr key={`header-${row.dayEntry.day}`}>
                                            <td
                                                colSpan={4}
                                                className={`text-sm font-medium text-on-surface py-2 ${i > 0 ? "pt-4" : ""}`}
                                            >
                                                {row.dayEntry.dayOfWeek}
                                                {row.dayEntry.items.length === 0 && (
                                                    <span className="text-secondary font-normal ml-2">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }

                                if (row.type === "stream-header") {
                                    return (
                                        <tr key={`stream-${row.group.key}`}>
                                            <td
                                                colSpan={4}
                                                className={`text-sm font-medium text-on-surface py-2 ${i > 0 ? "pt-4" : ""}`}
                                            >
                                                {row.group.label}
                                                {row.group.items.length === 0 && (
                                                    <span className="text-secondary font-normal ml-2">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                }

                                return (
                                    <SummaryRow
                                        key={`${row.dateKey}-${row.item.signalId}`}
                                        item={row.item}
                                        dateKey={row.dateKey}
                                        isFocused={focusedRowIdx === i}
                                        onMouseEnter={() => setFocusedRowIdx(i)}
                                        onClick={() => setFocusedRowIdx(i)}
                                    />
                                );
                            })}
                        </tbody>
                    </table>

                    {editMode && (
                        <p className="text-xs text-outline mt-3 select-none">
                            ↑↓ navigate · H or Space hide/unhide · Enter exit
                        </p>
                    )}
                </>
            )}
        </SectionCard>
    );
}

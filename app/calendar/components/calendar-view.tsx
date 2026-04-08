"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import type { MonthData, DaySignalActivity } from "../page";
import { SectionCard } from "@/components/ui/section-card";
import { ExternalLink } from "lucide-react";
import { toggleSummaryExclusion } from "@/app/actions/signals";

const MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number): number {
    return new Date(year, month, 1).getDay();
}

function prevMonth(year: number, month: number): { year: number; month: number } {
    return month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
}

function nextMonth(year: number, month: number): { year: number; month: number } {
    return month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
}

function dayKey(year: number, month: number, day: number): string {
    return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function CalendarView({
    year,
    month,
    data,
}: {
    year: number;
    month: number;
    data: MonthData;
}) {
    const router = useRouter();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfWeek(year, month);
    const prev = prevMonth(year, month);
    const next = nextMonth(year, month);

    const today = new Date();
    const todayKey = dayKey(today.getFullYear(), today.getMonth(), today.getDate());
    const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();
    const defaultDay = isCurrentMonth ? today.getDate() : 1;

    const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set([defaultDay]));
    const [cursor, setCursor] = useState<number>(defaultDay);

    useEffect(() => {
        const d = (year === today.getFullYear() && month === today.getMonth()) ? today.getDate() : 1;
        setSelectedDays(new Set([d]));
        setCursor(d);
    }, [year, month]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === "ArrowLeft") {
                    e.preventDefault();
                    router.push(`/calendar?year=${prev.year}&month=${prev.month + 1}`);
                    return;
                }
                if (e.key === "ArrowRight") {
                    e.preventDefault();
                    router.push(`/calendar?year=${next.year}&month=${next.month + 1}`);
                    return;
                }
            }

            let delta = 0;
            if (e.key === "ArrowLeft") delta = -1;
            else if (e.key === "ArrowRight") delta = 1;
            else if (e.key === "ArrowUp") delta = -7;
            else if (e.key === "ArrowDown") delta = 7;

            if (delta !== 0) {
                e.preventDefault();
                setCursor((prev) => {
                    const next = Math.max(1, Math.min(daysInMonth, prev + delta));
                    if (e.shiftKey && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
                        setSelectedDays((s) => {
                            const ns = new Set(s);
                            ns.add(next);
                            return ns;
                        });
                    } else {
                        setSelectedDays(new Set([next]));
                    }
                    return next;
                });
            }
        },
        [daysInMonth, prev, next, router]
    );

    useEffect(() => {
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);

    const navActions = (
        <>
            <Link
                href={`/calendar?year=${prev.year}&month=${prev.month + 1}`}
                className="px-3 py-1.5 text-sm rounded-md border border-outline-variant/40 text-secondary hover:text-on-surface hover:border-outline transition-colors"
            >
                ← Prev
            </Link>
            <Link
                href="/calendar"
                className="px-3 py-1.5 text-sm rounded-md border border-outline-variant/40 text-secondary hover:text-on-surface hover:border-outline transition-colors"
            >
                Today
            </Link>
            <Link
                href={`/calendar?year=${next.year}&month=${next.month + 1}`}
                className="px-3 py-1.5 text-sm rounded-md border border-outline-variant/40 text-secondary hover:text-on-surface hover:border-outline transition-colors"
            >
                Next →
            </Link>
        </>
    );

    return (
        <>
        <SectionCard title={`${MONTH_NAMES[month]} ${year}`} actions={navActions}>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-outline-variant/30 mb-px">
                {DAY_LABELS.map((label) => (
                    <div
                        key={label}
                        className="py-2 text-center text-xs font-medium text-secondary uppercase tracking-wider"
                    >
                        {label}
                    </div>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 border-l border-outline-variant/30">
                {cells.map((day, i) => {
                    const key = day ? dayKey(year, month, day) : `empty-${i}`;
                    const dayDetail = day ? data[dayKey(year, month, day)] : null;
                    const counts = dayDetail?.counts ?? null;
                    const isToday = day ? dayKey(year, month, day) === todayKey : false;
                    const isSelected = day ? selectedDays.has(day) : false;

                    return (
                        <div
                            key={key}
                            onClick={() => {
                                if (!day) return;
                                setCursor(day);
                                setSelectedDays(new Set([day]));
                            }}
                            className={`
                min-h-[100px] border-r border-b border-outline-variant/30 p-3 cursor-pointer
                ${day ? "bg-surface-container-lowest" : "bg-white pointer-events-none"}
                ${isToday ? "ring-2 ring-inset ring-primary/20" : ""}
                ${isSelected ? "ring-2 ring-inset ring-primary" : ""}
              `}
                        >
                            {day && (
                                <div className="flex flex-col justify-between h-full">
                                    <span
                                        className={`
                      text-2xl font-semibold tracking-tight
                      ${isToday ? "text-on-surface" : "text-on-surface"}
                    `}
                                    >
                                        {String(day).padStart(2, "0")}
                                    </span>

                                    {counts && (counts.created > 0 || counts.worked > 0 || counts.resolved > 0) && (
                                        <span className="text-xs text-secondary mt-auto">
                                            {[
                                                counts.created > 0 ? `${counts.created}c` : null,
                                                counts.worked > 0 ? `${counts.worked}w` : null,
                                                counts.resolved > 0 ? `${counts.resolved}r` : null,
                                            ]
                                                .filter(Boolean)
                                                .join(" ")}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </SectionCard>

        <DaySummary
            year={year}
            month={month}
            selectedDays={selectedDays}
            data={data}
        />
        </>
    );
}

const DAY_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MONTH_SHORT = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

type SummaryItem = { signalId: string; label: string; title: string; url?: string; excludedFromSummary: boolean };

function summarizeSignals(signals: DaySignalActivity[]): SummaryItem[] {
    return signals.map((s) => {
        const base = { signalId: s.signalId, title: s.title, url: s.primarySourceUrl, excludedFromSummary: s.excludedFromSummary };
        if (s.resolved) return { label: "Resolved", ...base };
        if (s.created) return { label: "Started", ...base };
        if (s.worked) return { label: "Progressed", ...base };
        return { label: "Touched", ...base };
    });
}

function DaySummary({
    year,
    month,
    selectedDays,
    data,
}: {
    year: number;
    month: number;
    selectedDays: Set<number>;
    data: MonthData;
}) {
    const sortedDays = Array.from(selectedDays).sort((a, b) => a - b);

    const dayEntries = sortedDays.map((day) => {
        const date = new Date(year, month, day);
        const dayOfWeek = DAY_OF_WEEK[date.getDay()];
        const signals = data[dayKey(year, month, day)]?.signals ?? [];
        const items = summarizeSignals(signals);
        return { day, dayOfWeek, items, dateKey: dayKey(year, month, day) };
    });

    const hasAnyIncludedItems = dayEntries.some((d) => d.items.some((i) => !i.excludedFromSummary));
    const isSingleDay = sortedDays.length === 1;

    const titleLabel = isSingleDay
        ? `${MONTH_SHORT[month]} ${sortedDays[0]}, ${year}`
        : `${MONTH_SHORT[month]} ${sortedDays[0]}–${sortedDays[sortedDays.length - 1]}, ${year}`;

    function buildSummaryText(): string {
        function formatItem(i: SummaryItem): string {
            return i.url ? `• ${i.label} [${i.title}](${i.url})` : `• ${i.label} ${i.title}`;
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

    return (
        <SectionCard
            title={titleLabel}
            actions={
                hasAnyIncludedItems ? (
                    <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(buildSummaryText())}
                        className="px-3 py-1.5 text-sm rounded-md border border-outline-variant/40 text-secondary hover:text-on-surface hover:border-outline transition-colors"
                    >
                        Copy
                    </button>
                ) : null
            }
            className="mt-4"
        >
            {isSingleDay ? (
                dayEntries[0].items.length === 0 ? (
                    <p className="text-sm text-secondary">No signal activity on this day.</p>
                ) : (
                    <ul className="space-y-1.5">
                        {dayEntries[0].items.map((item, i) => (
                            <li key={i} className={`text-sm text-on-surface flex items-center gap-2${item.excludedFromSummary ? " opacity-40" : ""}`}>
                                <span className="flex-1">
                                    <span className="text-secondary">•</span> {item.label}{" "}
                                    {item.url ? (
                                        <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline inline-flex items-center gap-1">
                                            {item.title}
                                            <ExternalLink className="size-3 inline shrink-0" />
                                        </a>
                                    ) : (
                                        <span className="font-medium">{item.title}</span>
                                    )}
                                </span>
                                <form action={toggleSummaryExclusion.bind(null, null)}>
                                    <input type="hidden" name="signalId" value={item.signalId} />
                                    <input type="hidden" name="date" value={dayEntries[0].dateKey} />
                                    <button type="submit" className="text-xs text-outline hover:text-secondary transition-colors shrink-0">
                                        {item.excludedFromSummary ? "Unhide" : "Hide"}
                                    </button>
                                </form>
                            </li>
                        ))}
                    </ul>
                )
            ) : (
                <div className="space-y-4">
                    {dayEntries.map((d) => (
                        <div key={d.day}>
                            <h3 className="text-sm font-medium text-on-surface mb-1">{d.dayOfWeek}</h3>
                            {d.items.length === 0 ? (
                                <p className="text-sm text-secondary ml-2">—</p>
                            ) : (
                                <ul className="space-y-1 ml-2">
                                    {d.items.map((item, i) => (
                                        <li key={i} className={`text-sm text-on-surface flex items-center gap-2${item.excludedFromSummary ? " opacity-40" : ""}`}>
                                            <span className="flex-1">
                                                <span className="text-secondary">•</span> {item.label}{" "}
                                                {item.url ? (
                                                    <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline inline-flex items-center gap-1">
                                                        {item.title}
                                                        <ExternalLink className="size-3 inline shrink-0" />
                                                    </a>
                                                ) : (
                                                    <span className="font-medium">{item.title}</span>
                                                )}
                                            </span>
                                            <form action={toggleSummaryExclusion.bind(null, null)}>
                                                <input type="hidden" name="signalId" value={item.signalId} />
                                                <input type="hidden" name="date" value={d.dateKey} />
                                                <button type="submit" className="text-xs text-outline hover:text-secondary transition-colors shrink-0">
                                                    {item.excludedFromSummary ? "Unhide" : "Hide"}
                                                </button>
                                            </form>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </SectionCard>
    );
}

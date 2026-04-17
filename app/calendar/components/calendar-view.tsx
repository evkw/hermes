"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import type { MonthData } from "../page";
import { SectionCard } from "@/components/ui/section-card";
import { DaySummary } from "./day-summary";

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

export type SummaryMode = "by-day" | "by-stream";

export function CalendarView({
    year,
    month,
    data,
    hasStreams,
}: {
    year: number;
    month: number;
    data: MonthData;
    hasStreams: boolean;
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
    const [editMode, setEditMode] = useState(false);
    const [summaryMode, setSummaryMode] = useState<SummaryMode>("by-day");
    const summaryTableRef = useRef<HTMLTableElement>(null);

    useEffect(() => {
        const d = (year === today.getFullYear() && month === today.getMonth()) ? today.getDate() : 1;
        setSelectedDays(new Set([d]));
        setCursor(d);
    }, [year, month]);

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            // When summary table is in edit mode, let it own keyboard
            if (editMode) return;

            if (e.key === "Enter") {
                e.preventDefault();
                setEditMode(true);
                summaryTableRef.current?.focus();
                return;
            }

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
        [daysInMonth, prev, next, router, editMode]
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
            tableRef={summaryTableRef}
            editMode={editMode}
            onExitEditMode={() => setEditMode(false)}
            summaryMode={hasStreams ? summaryMode : "by-day"}
            modeToggle={hasStreams ? (
                <div className="flex gap-1">
                    <button
                        type="button"
                        onClick={() => setSummaryMode("by-day")}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            summaryMode === "by-day"
                                ? "border-primary text-primary"
                                : "border-outline-variant/40 text-secondary hover:text-on-surface hover:border-outline"
                        }`}
                    >
                        By Day
                    </button>
                    <button
                        type="button"
                        onClick={() => setSummaryMode("by-stream")}
                        className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
                            summaryMode === "by-stream"
                                ? "border-primary text-primary"
                                : "border-outline-variant/40 text-secondary hover:text-on-surface hover:border-outline"
                        }`}
                    >
                        By Stream
                    </button>
                </div>
            ) : null}
        />
        </>
    );
}

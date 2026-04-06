"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/core/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/core/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/core/table";
import { markWorkedToday, resolveSignal, increaseRisk } from "@/app/actions/signals";
import { NewEventDialog } from "@/app/components/new-event-dialog";

type RetroEvent = {
    id: string;
    eventType: string;
    note: string | null;
    createdAt: string;
};

type RetroSignal = {
    id: string;
    title: string;
    description: string | null;
    riskLevel: string;
    events: RetroEvent[];
};

function formatEventType(eventType: string): string {
    return eventType
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });
}

function RetroCard({ signal }: { signal: RetroSignal }) {
    return (
        <div>
            <h1 className="text-3xl font-semibold tracking-tight text-on-surface">
                {signal.title}
            </h1>

            {signal.description && (
                <p className="mt-3 text-sm text-secondary leading-relaxed max-w-2xl">
                    {signal.description}
                </p>
            )}

            {/* Last 3 events */}
            {signal.events.length > 0 && (
                <div className="mt-8 rounded-lg border border-outline-variant/40">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-xs font-medium uppercase tracking-wider text-secondary" colSpan={3}>
                                    Last 3 events
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {signal.events.map((event) => (
                                <TableRow key={event.id}>
                                    <TableCell className="text-xs font-medium text-on-surface w-28">
                                        {formatEventType(event.eventType)}
                                    </TableCell>
                                    <TableCell className="text-sm text-on-surface">
                                        {event.note || <span className="text-outline">—</span>}
                                    </TableCell>
                                    <TableCell className="text-xs text-secondary text-right w-24">
                                        {formatDate(event.createdAt)}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex items-center gap-4">
                <DropdownMenu>
                    <DropdownMenuTrigger
                        render={
                            <Button variant="ghost" size="icon" aria-label="More actions">
                                <MoreHorizontal className="size-5" />
                            </Button>
                        }
                    />
                    <DropdownMenuContent align="start" sideOffset={4}>
                        <NewEventDialog signalId={signal.id} signalTitle={signal.title}>
                            <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                            >
                                Add Note
                            </DropdownMenuItem>
                        </NewEventDialog>
                        <form action={increaseRisk.bind(null, signal.id)}>
                            <DropdownMenuItem
                                onSelect={(e) => {
                                    e.preventDefault();
                                    (e.currentTarget.closest("form") as HTMLFormElement)?.requestSubmit();
                                }}
                            >
                                Increase Risk
                            </DropdownMenuItem>
                        </form>
                    </DropdownMenuContent>
                </DropdownMenu>

                <form action={markWorkedToday.bind(null, signal.id)}>
                    <Button variant="outline" size="sm" type="submit">
                        Worked Today
                    </Button>
                </form>

                <form action={resolveSignal.bind(null, signal.id)}>
                    <Button variant="outline" size="sm" type="submit">
                        Mark Resolved
                    </Button>
                </form>
            </div>
        </div>
    );
}

export function RetroView({ signals }: { signals: RetroSignal[] }) {
    const [index, setIndex] = useState(0);
    const total = signals.length;
    const current = signals[index];

    return (
        <div>
            <div className="mb-10">
                <h1 className="text-2xl font-semibold tracking-tight text-on-surface">
                    Retro
                </h1>
            </div>

            <RetroCard signal={current} />

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-between">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIndex((i) => i - 1)}
                    disabled={index === 0}
                >
                    prev
                </Button>

                <span className="text-sm text-secondary tabular-nums">
                    {index + 1} / {total}
                </span>

                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIndex((i) => i + 1)}
                    disabled={index === total - 1}
                >
                    next
                </Button>
            </div>
        </div>
    );
}

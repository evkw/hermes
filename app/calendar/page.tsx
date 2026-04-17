import { db } from "@/lib/db";
import { CalendarView } from "./components/calendar-view";

export const dynamic = "force-dynamic";

export type DayCounts = {
  created: number;
  worked: number;
  resolved: number;
};

export type DaySignalActivity = {
  signalId: string;
  title: string;
  created: boolean;
  worked: boolean;
  resolved: boolean;
  primarySourceUrl?: string;
  excludedFromSummary: boolean;
  streams: { id: string; name: string }[];
};

export type DayDetail = {
  counts: DayCounts;
  signals: DaySignalActivity[];
};

export type MonthData = Record<string, DayDetail>;

async function getMonthData(year: number, month: number): Promise<MonthData> {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 1);

  const [signals, events, exclusions] = await Promise.all([
    db.signal.findMany({
      where: {
        createdAt: { gte: start, lt: end },
      },
      select: { id: true, title: true, createdAt: true, sources: { select: { url: true }, orderBy: { createdAt: "asc" } }, streams: { select: { id: true, name: true } } },
    }),
    db.signalEvent.findMany({
      where: {
        createdAt: { gte: start, lt: end },
        eventType: { in: ["worked_today", "resolved", "note_added", "link_attached"] },
      },
      select: { eventType: true, createdAt: true, signalId: true, signal: { select: { title: true, sources: { select: { url: true }, orderBy: { createdAt: "asc" } }, streams: { select: { id: true, name: true } } } } },
    }),
    db.summaryExclusion.findMany({
      where: { date: { gte: start, lt: end } },
      select: { signalId: true, date: true },
    }),
  ]);

  const excludedKeys = new Set(
    exclusions.map((ex) => {
      const d = ex.date;
      return `${ex.signalId}:${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })
  );

  const data: MonthData = {};

  function getKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function ensure(key: string): DayDetail {
    if (!data[key]) data[key] = { counts: { created: 0, worked: 0, resolved: 0 }, signals: [] };
    return data[key];
  }

  function ensureSignal(day: DayDetail, signalId: string, title: string, sources?: { url: string | null }[], streams?: { id: string; name: string }[]): DaySignalActivity {
    let entry = day.signals.find((s) => s.signalId === signalId);
    if (!entry) {
      entry = { signalId, title, created: false, worked: false, resolved: false, excludedFromSummary: false, streams: streams ?? [] };
      day.signals.push(entry);
    }
    if (!entry.primarySourceUrl && sources) {
      const firstUrl = sources.find((s) => s.url)?.url;
      if (firstUrl) entry.primarySourceUrl = firstUrl;
    }
    return entry;
  }

  for (const s of signals) {
    const key = getKey(s.createdAt);
    const day = ensure(key);
    day.counts.created++;
    ensureSignal(day, s.id, s.title, s.sources, s.streams).created = true;
  }

  for (const e of events) {
    const key = getKey(e.createdAt);
    const day = ensure(key);
    const entry = ensureSignal(day, e.signalId, e.signal.title, e.signal.sources, e.signal.streams);
    if (e.eventType === "worked_today" || e.eventType === "note_added" || e.eventType === "link_attached") {
      if (!entry.worked) {
        day.counts.worked++;
        entry.worked = true;
      }
    }
    if (e.eventType === "resolved") {
      day.counts.resolved++;
      entry.resolved = true;
    }
  }

  for (const key of Object.keys(data)) {
    for (const signal of data[key].signals) {
      if (excludedKeys.has(`${signal.signalId}:${key}`)) {
        signal.excludedFromSummary = true;
      }
    }
  }

  return data;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const params = await searchParams;
  const now = new Date();
  const year = params.year ? parseInt(params.year, 10) : now.getFullYear();
  const month = params.month ? parseInt(params.month, 10) - 1 : now.getMonth();

  const [monthData, streamCount] = await Promise.all([
    getMonthData(year, month),
    db.stream.count(),
  ]);

  return (
    <div className="max-w-screen-xl mx-auto px-6 md:px-12 py-8">
      <CalendarView year={year} month={month} data={monthData} hasStreams={streamCount > 0} />
    </div>
  );
}
